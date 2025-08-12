// src/components/isc/components/RelationshipMap.js
import React, { useEffect, useRef } from 'react';
import { ICONS } from '../../constants';
// D3.js와 같은 라이브러리를 사용하기 위해 CDN에서 직접 로드하거나,
// 프로젝트에 라이브러리를 설치해야 합니다.
// 여기서는 CDN을 사용하는 것을 가정하고 스크립트 태그를 동적으로 추가합니다.

/**
 * D3.js를 사용하여 인물 관계도를 시각화하는 인터랙티브 컴포넌트입니다.
 * @param {object} props - { data, onAction }
 * @param {object} props.data - AI가 보낸 데이터. { title, characters, links }
 * @param {function} props.onAction - (미래 확장용) 노드 클릭 등 액션 전달 콜백
 */
const RelationshipMap = ({ data, onAction }) => {
  const d3Container = useRef(null);

  // --- 데이터 추출 및 기본값 설정 ---
  const {
    title = "인물 관계도",
    characters = [], // characters는 { id, name } 형태의 객체 배열
    links = [] // links는 { source, target, label, strength } 형태의 객체 배열
  } = data;

  useEffect(() => {
    // D3.js 스크립트를 동적으로 로드합니다.
    const script = document.createElement('script');
    script.src = 'https://d3js.org/d3.v7.min.js';
    script.async = true;
    script.onload = () => {
      // D3.js가 로드된 후 그래프를 렌더링합니다.
      renderD3Graph();
    };
    document.body.appendChild(script);

    return () => {
      // 컴포넌트가 언마운트될 때 스크립트를 제거합니다.
      document.body.removeChild(script);
    };
  }, [data]); // data가 변경될 때마다 그래프를 다시 렌더링합니다.

  const renderD3Graph = () => {
    if (!window.d3 || !d3Container.current || characters.length === 0) return;

    // 기존 SVG가 있다면 제거합니다.
    window.d3.select(d3Container.current).select("svg").remove();

    const width = d3Container.current.clientWidth;
    const height = 400;

    const nodes = characters.map(d => ({...d}));
    const linksData = links.map(d => ({...d}));

    const simulation = window.d3.forceSimulation(nodes)
        .force("link", window.d3.forceLink(linksData).id(d => d.id).distance(150))
        .force("charge", window.d3.forceManyBody().strength(-200))
        .force("center", window.d3.forceCenter(width / 2, height / 2));

    const svg = window.d3.select(d3Container.current).append("svg")
        .attr("viewBox", [0, 0, width, height])
        .attr("width", width)
        .attr("height", height);

    const link = svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(linksData)
      .join("line")
        .attr("stroke-width", d => Math.sqrt(d.strength) * 2);

    const node = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
        .attr("r", 15)
        .attr("fill", "#8A2BE2");
    
    const labels = svg.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
        .text(d => d.name)
        .attr("fill", "white")
        .attr("font-size", "12px")
        .attr("dx", 20)
        .attr("dy", 5);

    simulation.on("tick", () => {
      link
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);

      node
          .attr("cx", d => d.x)
          .attr("cy", d => d.y);
      
      labels
          .attr("x", d => d.x)
          .attr("y", d => d.y);
    });
  };

  return (
    <div className="my-8 animate-fadeIn">
      <div className="bg-gray-800/70 border border-purple-700/50 rounded-xl shadow-lg w-full max-w-2xl mx-auto font-sans backdrop-blur-sm">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-purple-400 flex items-center">
            <ICONS.LucideHeartHandshake className="w-5 h-5 mr-3" />
            {title}
          </h2>
        </div>
        <div ref={d3Container} className="p-4" style={{ minHeight: '400px' }}>
          {/* D3.js 그래프가 여기에 렌더링됩니다. */}
        </div>
      </div>
    </div>
  );
};

export default RelationshipMap;
