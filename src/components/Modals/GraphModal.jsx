import React, { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import * as d3 from 'd3';

export function GraphModal({ tabs, isOpen, onClose, onNavigate }) {
    const containerRef = useRef(null);

    // Replicating legacy getItemPath for path-based linking
    const getItemPath = useCallback((item, items = tabs) => {
        const findParent = (id, list, p = null) => {
            for (const it of list) {
                if (it.id === id) return p;
                if (it.children) {
                    const res = findParent(id, it.children, it);
                    if (res) return res;
                }
            }
            return null;
        };
        const p = findParent(item.id, items);
        if (p) {
            return (getItemPath(p, items) + '/' + item.title).replace(/^\//, '');
        }
        return item.title;
    }, [tabs]);

    const findTabByPath = useCallback((path, items = tabs) => {
        const parts = path.split('/');
        let currentLevel = items;
        let found = null;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const match = currentLevel.find(it => it.title.toLowerCase() === part.toLowerCase());
            if (!match) return null;
            if (i === parts.length - 1 && match.type === 'note') {
                found = match;
            } else if (match.children) {
                currentLevel = match.children;
            } else {
                return null;
            }
        }
        return found;
    }, [tabs]);

    const findTabByTitle = useCallback((title, items = tabs) => {
        for (const item of items) {
            if (item.type === 'note' && item.title.toLowerCase() === title.toLowerCase()) return item;
            if (item.children) {
                const found = findTabByTitle(title, item.children);
                if (found) return found;
            }
        }
        return null;
    }, [tabs]);

    useEffect(() => {
        if (!isOpen || !containerRef.current) return;

        // Clear previous graph
        containerRef.current.innerHTML = '';
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        const nodes = [];
        const links = [];

        // Helper to flatten and gather data Exactly like legacy
        const gatherGraphData = (items) => {
            items.forEach(item => {
                if (item.type === 'note') {
                    const fullPath = getItemPath(item);
                    nodes.push({ id: fullPath, title: item.title, realId: item.id });

                    // Find links [[Link]]
                    const linkMatches = (item.content || '').matchAll(/\[\[([^\]]+)\]\]/g);
                    for (const match of linkMatches) {
                        const targetName = match[1].trim();
                        const targetTab = targetName.includes('/') ? findTabByPath(targetName) : findTabByTitle(targetName);
                        if (targetTab) {
                            links.push({ source: fullPath, target: getItemPath(targetTab) });
                        }
                    }
                } else if (item.children) {
                    gatherGraphData(item.children);
                }
            });
        };

        gatherGraphData(tabs);

        const svg = d3.select(containerRef.current)
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", [0, 0, width, height]);

        const g = svg.append("g");

        svg.call(d3.zoom().scaleExtent([0.1, 8]).on("zoom", (event) => {
            g.attr("transform", event.transform);
        }));

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(120))
            .force("charge", d3.forceManyBody().strength(-400))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(50));

        const link = g.append("g")
            .attr("stroke", "#444")
            .attr("stroke-opacity", 0.4)
            .attr("stroke-width", 1.5)
            .selectAll("line")
            .data(links)
            .join("line");

        const node = g.append("g")
            .selectAll("g")
            .data(nodes)
            .join("g")
            .attr("class", "node-group")
            .style("cursor", "pointer")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        node.append("circle")
            .attr("r", 10)
            .attr("fill", "#3b82f6")
            .attr("stroke", "#1e40af")
            .attr("stroke-width", 2)
            .style("filter", "drop-shadow(0 0 10px rgba(59,130,246,0.3))");

        node.append("text")
            .attr("dx", 16)
            .attr("dy", ".35em")
            .text(d => d.title)
            .attr("fill", "#ccc")
            .style("font-size", "11px")
            .style("font-weight", "600")
            .style("user-select", "none")
            .style("letter-spacing", "0.02em");

        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node
                .attr("transform", d => `translate(${d.x},${d.y})`);
        });

        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        node.on("click", (event, d) => {
            onNavigate(d.realId);
            onClose();
        });

    }, [isOpen, tabs, onNavigate, onClose, getItemPath, findTabByPath, findTabByTitle]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[60] flex items-center justify-center p-8 animate-in fade-in duration-300">
            <div className="bg-ez-bg border border-ez-border rounded-3xl shadow-[0_30px_100px_rgba(0,0,0,0.8)] w-full h-full relative flex flex-col overflow-hidden animate-in zoom-in duration-300">
                <div className="flex justify-between items-center p-8 border-b border-ez-border">
                    <div className="flex items-center gap-4">
                        <i className="fas fa-project-diagram text-blue-500 text-2xl"></i>
                        <h3 className="text-2xl font-bold text-ez-text tracking-tight">Connected Intelligence</h3>
                    </div>
                    <button onClick={onClose} className="text-ez-meta hover:text-ez-text transition p-3 bg-ez-border/20 rounded-full">
                        <X size={20} />
                    </button>
                </div>
                <div id="graphContainer" ref={containerRef} className="flex-1 bg-black/40 relative"></div>
                <div className="p-6 border-t border-ez-border bg-black/20 text-[10px] text-ez-meta flex justify-center gap-8 font-bold tracking-widest uppercase opacity-60">
                    <span><i className="fas fa-mouse-pointer mr-2"></i> DRAG TO REORGANIZE</span>
                    <span><i className="fas fa-search-plus mr-2"></i> SCROLL TO ZOOM</span>
                    <span><i className="fas fa-hand-point-up mr-2"></i> CLICK TO NAVIGATE</span>
                </div>
            </div>
        </div>
    );
}
