'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var ws = require('lib0/dist/websocket.js');
var map = require('lib0/dist/map.js');
var error = require('lib0/dist/error.js');
var random = require('lib0/dist/random.js');
var encoding = require('lib0/dist/encoding.js');
var decoding = require('lib0/dist/decoding.js');
var observable_js = require('lib0/dist/observable.js');
var logging = require('lib0/dist/logging.js');
var promise = require('lib0/dist/promise.js');
require('yjs');
var Peer = _interopDefault(require('simple-peer/simplepeer.min.js'));
var syncProtocol = require('y-protocols/dist/sync.js');
var awarenessProtocol = require('y-protocols/dist/awareness.js');
var buffer = require('lib0/dist/buffer.js');
var string = require('lib0/dist/string.js');

/* eslint-env browser */

/**
 * @param {string} secret
 * @param {string} roomName
 * @return {PromiseLike<CryptoKey>}
 */
const deriveKey = (secret, roomName) => {
  const secretBuffer = string.encodeUtf8(secret).buffer;
  const salt = string.encodeUtf8(roomName).buffer;
  return crypto.subtle.importKey(
    'raw',
    secretBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  ).then(keyMaterial =>
    crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      [ 'encrypt', 'decrypt' ]
    )
  )
};

/**
 * @param {any} data A json object to be encrypted
 * @param {CryptoKey} key
 * @return {PromiseLike<string>} encrypted, base64 encoded message
 */
const encrypt = (data, key) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const dataEncoder = encoding.createEncoder();
  encoding.writeAny(dataEncoder, data);
  const dataBuffer = encoding.toUint8Array(dataEncoder);
  return crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    dataBuffer
  ).then(cipher => {
    const encryptedDataEncoder = encoding.createEncoder();
    encoding.writeVarString(encryptedDataEncoder, 'AES-GCM');
    encoding.writeVarUint8Array(encryptedDataEncoder, iv);
    encoding.writeVarUint8Array(encryptedDataEncoder, new Uint8Array(cipher));
    return buffer.toBase64(encoding.toUint8Array(encryptedDataEncoder))
  })
};

/**
 * @param {string} data
 * @param {CryptoKey} key
 * @return {PromiseLike<any>} decrypted object
 */
const decrypt = (data, key) => {
  if (typeof data !== 'string') {
    return promise.reject()
  }
  const dataDecoder = decoding.createDecoder(buffer.fromBase64(data));
  const algorithm = decoding.readVarString(dataDecoder);
  if (algorithm !== 'AES-GCM') {
    promise.reject(error.create('Unknown encryption algorithm'));
  }
  const iv = decoding.readVarUint8Array(dataDecoder);
  const cipher = decoding.readVarUint8Array(dataDecoder);
  return crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    cipher
  ).then(decryptedValue =>
    decoding.readAny(decoding.createDecoder(new Uint8Array(decryptedValue)))
  )
};

const log = logging.createModuleLogger('y-webrtc');

const messageSync = 0;
const messageQueryAwareness = 3;
const messageAwareness = 1;

/**
 * @type {Map<string, SignalingConn>}
 */
const signalingConns = new Map();

/**
 * @type {Map<string,Room>}
 */
const rooms = new Map();

/**
 * @param {Room} room
 */
const checkIsSynced = room => {
  let synced = true;
  room.webrtcConns.forEach(peer => {
    if (!peer.synced) {
      synced = false;
    }
  });
  if ((!synced && room.synced) || (synced && !room.synced)) {
    room.synced = synced;
    room.provider.emit('synced', [{ synced }]);
    log('synced ', logging.BOLD, room.name, logging.UNBOLD, ' with all peers');
  }
};

/**
 * @param {WebrtcConn} peerConn
 * @param {Uint8Array} buf
 * @return {encoding.Encoder?}
 */
const readPeerMessage = (peerConn, buf) => {
  const decoder = decoding.createDecoder(buf);
  const encoder = encoding.createEncoder();
  const messageType = decoding.readVarUint(decoder);
  const room = peerConn.room;
  if (room === undefined) {
    return null
  }
  const provider = room.provider;
  const doc = room.doc;
  let sendReply = false;
  switch (messageType) {
    case messageSync:
      encoding.writeVarUint(encoder, messageSync);
      const syncMessageType = syncProtocol.readSyncMessage(decoder, encoder, doc, room.provider);
      if (syncMessageType === syncProtocol.messageYjsSyncStep2 && !room.synced) {
        peerConn.synced = true;
        log('synced ', logging.BOLD, room.name, logging.UNBOLD, ' with ', logging.BOLD, peerConn.remotePeerId);
        checkIsSynced(room);
      }
      if (syncMessageType === syncProtocol.messageYjsSyncStep1) {
        sendReply = true;
      }
      break
    case messageQueryAwareness:
      encoding.writeVarUint(encoder, messageAwareness);
      encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(provider.awareness, Array.from(provider.awareness.getStates().keys())));
      sendReply = true;
      break
    case messageAwareness:
      awarenessProtocol.applyAwarenessUpdate(provider.awareness, decoding.readVarUint8Array(decoder), provider);
      break
    default:
      console.error('Unable to compute message');
      return encoder
  }
  if (!sendReply) {
    // nothing has been written, no answer created
    return null
  }
  return encoder
};

/**
 * @param {WebrtcConn} webrtcConn
 * @param {encoding.Encoder} encoder
 */
const sendWebrtcConn = (webrtcConn, encoder) => {
  if (webrtcConn.connected) {
    webrtcConn.peer.send(encoding.toUint8Array(encoder));
  }
};

/**
 * @param {Room} room
 * @param {encoding.Encoder} encoder
 */
const broadcastWebrtcConn = (room, encoder) => {
  const m = encoding.toUint8Array(encoder);
  room.webrtcConns.forEach(conn => {
    if (conn.connected) {
      conn.peer.send(m);
    }
  });
};

class WebrtcConn {
  /**
   * @param {SignalingConn} signalingConn
   * @param {boolean} initiator
   * @param {string} remotePeerId
   * @param {Room} room
   */
  constructor (signalingConn, initiator, remotePeerId, room) {
    log('establishing connection to ', logging.BOLD, remotePeerId);
    this.room = room;
    this.remotePeerId = remotePeerId;
    this.closed = false;
    this.connected = false;
    this.synced = false;
    /**
     * @type {any}
     */
    this.peer = new Peer({ initiator });
    this.peer.on('signal', signal => {
      publishSignalingMessage(signalingConn, room, { to: remotePeerId, from: room.peerId, type: 'signal', signal });
    });
    this.peer.on('connect', () => {
      log('connected to ', logging.BOLD, remotePeerId);
      this.connected = true;
      // send sync step 1
      const provider = room.provider;
      const doc = provider.doc;
      const awareness = provider.awareness;
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageSync);
      syncProtocol.writeSyncStep1(encoder, doc);
      sendWebrtcConn(this, encoder);
      const awarenessStates = awareness.getStates();
      if (awarenessStates.size > 0) {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, messageAwareness);
        encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(awareness, Array.from(awarenessStates.keys())));
        sendWebrtcConn(this, encoder);
      }
    });
    this.peer.on('close', () => {
      this.connected = false;
      this.closed = true;
      room.webrtcConns.delete(this.remotePeerId);
      checkIsSynced(room);
      this.peer.destroy();
      log('closed connection to ', logging.BOLD, remotePeerId);
    });
    this.peer.on('error', err => {
      log('error in connection to ', logging.BOLD, remotePeerId, ': ', err);
      this.connected = false;
      this.closed = true;
    });
    this.peer.on('data', data => {
      const answer = readPeerMessage(this, data);
      if (answer !== null) {
        sendWebrtcConn(this, answer);
      }
    });
  }
}

class Room {
  /**
   * @param {Y.Doc} doc
   * @param {WebrtcProvider} provider
   * @param {string} name
   * @param {CryptoKey|null} key
   */
  constructor (doc, provider, name, key) {
    /**
     * Do not assume that peerId is unique. This is only meant for sending signaling messages.
     *
     * @type {string}
     */
    this.peerId = random.uuidv4();
    this.doc = doc;
    this.provider = provider;
    this.synced = false;
    this.name = name;
    this.key = key;
    /**
     * @type {Map<string, WebrtcConn>}
     */
    this.webrtcConns = new Map();
  }
}

/**
 * @param {Y.Doc} doc
 * @param {WebrtcProvider} provider
 * @param {string} name
 * @param {CryptoKey|null} key
 * @return {Room}
 */
const openRoom = (doc, provider, name, key) => {
  // there must only be one room
  if (rooms.has(name)) {
    throw error.create('A Yjs Doc connected to that room already exists!')
  }
  const room = new Room(doc, provider, name, key);
  rooms.set(name, /** @type {Room} */ (room));
  // signal through all available signaling connections
  signalingConns.forEach(conn => {
    // only subcribe if connection is established, otherwise the conn automatically subscribes to all rooms
    if (conn.connected) {
      conn.send({ type: 'subscribe', topics: [name] });
      publishSignalingMessage(conn, room, { type: 'announce', from: room.peerId });
    }
  });
  return room
};

/**
 * @param {SignalingConn} conn
 * @param {Room} room
 * @param {any} data
 */
const publishSignalingMessage = (conn, room, data) => {
  if (room.key) {
    encrypt(data, room.key).then(data => {
      conn.send({ type: 'publish', topic: room.name, data });
    });
  } else {
    conn.send({ type: 'publish', topic: room.name, data });
  }
};

class SignalingConn extends ws.WebsocketClient {
  constructor (url) {
    super(url);
    /**
     * @type {Set<WebrtcProvider>}
     */
    this.providers = new Set();
    this.on('connect', () => {
      const topics = Array.from(rooms.keys());
      this.send({ type: 'subscribe', topics });
      rooms.forEach(room =>
        publishSignalingMessage(this, room, { type: 'announce', from: room.peerId })
      );
    });
    this.on('message', m => {
      switch (m.type) {
        case 'publish': {
          const roomName = m.topic;
          const room = rooms.get(roomName);
          if (room == null || typeof roomName !== 'string') {
            return
          }
          const execMessage = data => {
            const webrtcConns = room.webrtcConns;
            const peerId = room.peerId;
            if (data == null || data.from === peerId || (data.to !== undefined && data.to !== peerId)) {
              return
            }
            switch (data.type) {
              case 'announce':
                map.setIfUndefined(webrtcConns, data.from, () => new WebrtcConn(this, true, data.from, room));
                break
              case 'signal':
                if (data.to === peerId) {
                  map.setIfUndefined(webrtcConns, data.from, () => new WebrtcConn(this, false, data.from, room)).peer.signal(data.signal);
                }
                break
            }
          };
          if (room.key) {
            decrypt(m.data, room.key).then(execMessage);
          } else {
            execMessage(m.data);
          }
        }
      }
    });
    this.on('connect', () => log(`connected (${url})`));
    this.on('disconnect', () => log(`disconnect (${url})`));
  }
}

/**
 * @extends Observable<string>
 */
class WebrtcProvider extends observable_js.Observable {
  /**
   * @param {string} roomName
   * @param {Y.Doc} doc
   * @param {Object} [opts]
   * @param {Array<string>} [opts.signaling]
   * @param {string?} [opts.password]
   */
  constructor (roomName, doc, { signaling = ['wss://signaling.yjs.dev', 'wss://y-webrtc-uchplqjsol.now.sh', 'wss://y-webrtc-signaling-eu.herokuapp.com', 'wss://y-webrtc-signaling-us.herokuapp.com'], password = null } = {}) {
    super();
    this.roomName = roomName;
    this.doc = doc;
    this.signalingConns = [];
    /**
     * @type {PromiseLike<CryptoKey | null>}
     */
    this.key = password ? deriveKey(password, roomName) : /** @type {PromiseLike<null>} */ (promise.resolve(null));
    signaling.forEach(url => {
      const signalingConn = map.setIfUndefined(signalingConns, url, () => new SignalingConn(url));
      this.signalingConns.push(signalingConn);
      signalingConn.providers.add(this);
    });
    /**
     * @type {Room|null}
     */
    let room = null;
    this.key.then(key => {
      room = openRoom(doc, this, roomName, key);
    });
    /**
     * @type {awarenessProtocol.Awareness}
     */
    this.awareness = new awarenessProtocol.Awareness(doc);
    /**
     * Listens to Yjs updates and sends them to remote peers
     *
     * @param {Uint8Array} update
     * @param {any} origin
     */
    this._docUpdateHandler = (update, origin) => {
      if (room !== null && (origin !== this || origin === null)) {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, messageSync);
        syncProtocol.writeUpdate(encoder, update);
        broadcastWebrtcConn(room, encoder);
      }
    };
    /**
     * Listens to Awareness updates and sends them to remote peers
     *
     * @param {any} changed
     * @param {any} origin
     */
    this._awarenessUpdateHandler = ({ added, updated, removed }, origin) => {
      if (room !== null) {
        const changedClients = added.concat(updated).concat(removed);
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, messageAwareness);
        encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients));
        broadcastWebrtcConn(room, encoder);
      }
    };
    this.doc.on('update', this._docUpdateHandler);
    this.awareness.on('change', this._awarenessUpdateHandler);
    window.addEventListener('beforeunload', () => {
      awarenessProtocol.removeAwarenessStates(this.awareness, [doc.clientID], 'window unload');
    });
  }
  destroy () {
    super.destroy();
    this.signalingConns.forEach(conn => {
      conn.providers.delete(this);
      if (conn.providers.size === 0) {
        conn.destroy();
        signalingConns.delete(this.roomName);
      } else {
        conn.send({ type: 'unsubscribe', topics: [this.roomName] });
      }
    });
    // need to wait for key before deleting room
    this.key.then(() => {
      rooms.delete(this.roomName);
    });
    this.doc.off('update', this._docUpdateHandler);
    this.awareness.off('change', this._awarenessUpdateHandler);
    super.destroy();
  }
}

exports.Room = Room;
exports.SignalingConn = SignalingConn;
exports.WebrtcConn = WebrtcConn;
exports.WebrtcProvider = WebrtcProvider;
//# sourceMappingURL=y-webrtc.js.map
