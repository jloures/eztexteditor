import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import * as d3 from 'd3';

export function GraphModal({ tabs, isOpen, onClose, onNavigate }) {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!isOpen || !containerRef.current) return;

        // Clear previous graph
        containerRef.current.innerHTML = '';
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        const nodes = [];
        const links = [];

        // Helper to flatten and gather data
        const gatherGraphData = (items) => {
            items.forEach(item => {
                if (item.type === 'note') {
                    // Use path or title as ID. Legacy used path logic but simple ID might suffice if title unique.
                    // Legacy used: getItemPath(item). Let's stick to IDs for robustness, 
                    // BUT legacy graph showed Titles. 
                    nodes.push({ id: item.id, title: item.title });

                    // Find links [[Link]]
                    const linkMatches = (item.content || '').matchAll(/\[\[([^\]]+)\]\]/g);
                    for (const match of linkMatches) {
                        const targetTitle = match[1].trim();
                        // Find target ID by title (inefficient but mimics legacy behavior roughly)
                        // Ideally we have a lookup
                        // We need to traverse entire state to find ID by title
                        const targetNode = findNodeByTitle(tabs, targetTitle);
                        if (targetNode) {
                            links.push({ source: item.id, target: targetNode.id });
                        }
                    }
                } else if (item.children) {
                    gatherGraphData(item.children);
                }
            });
        };

        const findNodeByTitle = (items, title) => {
            for (const item of items) {
                if (item.type === 'note' && item.title.toLowerCase() === title.toLowerCase()) return item;
                if (item.children) {
                    const found = findNodeByTitle(item.children, title);
                    if (found) return found;
                }
            }
            return null;
        };

        gatherGraphData(tabs);

        const svg = d3.select(containerRef.current)
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", [0, 0, width, height]);

        const g = svg.append("g");

        svg.call(d3.zoom().on("zoom", (event) => {
            g.attr("transform", event.transform);
        }));

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2));

        const link = g.append("g")
            .attr("stroke", "#555")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(links)
            .join("line");

        const node = g.append("g")
            .selectAll("g")
            .data(nodes)
            .join("g")
            .attr("class", "node")
            .style("cursor", "pointer")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        node.append("circle")
            .attr("r", 8)
            .attr("fill", "#3b82f6");

        node.append("text")
            .attr("dx", 12)
            .attr("dy", ".35em")
            .text(d => d.title)
            .attr("fill", "#ccc")
            .style("font-size", "10px")
            .style("user-select", "none");

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
            onNavigate(d.id);
            onClose();
        });

    }, [isOpen, tabs, onNavigate, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-ez-bg border border-ez-border rounded-xl shadow-2xl w-[90vw] h-[90vh] relative flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-ez-border">
                    <h3 className="text-xl font-bold text-ez-text">Notebook Graph View</h3>
                    <button onClick={onClose} className="text-ez-meta hover:text-ez-text transition">
                        <X size={24} />
                    </button>
                </div>
                <div id="graphContainer" ref={containerRef} className="flex-1 bg-black/50 overflow-hidden relative"></div>
                <p className="text-xs text-center text-ez-meta p-2">Zoom with mouse wheel, drag to pan and move nodes.</p>
            </div>
        </div>
    );
}
