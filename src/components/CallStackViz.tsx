import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { usePlaygroundStore } from '../store/usePlaygroundStore'
import type { StackFrame } from '../store/usePlaygroundStore'

export function CallStackViz() {
  const { callStack, currentStep } = usePlaygroundStore()
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const W = svgRef.current?.clientWidth || 220
    const frameH = 44
    const frameGap = 6
    const frames = [...callStack].reverse() 

    if (frames.length === 0) {
      svg
        .append('text')
        .attr('x', W / 2)
        .attr('y', 60)
        .attr('text-anchor', 'middle')
        .attr('fill', '#374151')
        .attr('font-size', 12)
        .attr('font-family', '"JetBrains Mono", monospace')
        .text('Stack is empty')
      return
    }

    const totalH = frames.length * (frameH + frameGap)
    svg.attr('height', Math.max(totalH + 20, 80))

    const g = svg.append('g').attr('transform', 'translate(10, 10)')

    frames.forEach((frame: StackFrame, i) => {
      const isTop = i === 0
      const y = i * (frameH + frameGap)

      const fg = g.append('g')
        .attr('class', 'stack-frame')
        .attr('transform', `translate(0, ${y})`)
        .style('animation', `stackPush 0.3s ease-out`)

      // Frame background
      fg.append('rect')
        .attr('width', W - 20)
        .attr('height', frameH)
        .attr('rx', 5)
        .attr('fill', isTop ? '#00e5ff10' : '#16162a')
        .attr('stroke', isTop ? '#00e5ff55' : '#1e1e35')
        .attr('stroke-width', 1)

      // Left accent
      fg.append('rect')
        .attr('width', 3)
        .attr('height', frameH)
        .attr('rx', 2)
        .attr('fill', isTop ? '#00e5ff' : '#a855f7')

      // Frame name
      fg.append('text')
        .attr('x', 14)
        .attr('y', frameH / 2 - 4)
        .attr('dominant-baseline', 'middle')
        .attr('fill', isTop ? '#00e5ff' : '#c4c4e0')
        .attr('font-size', 13)
        .attr('font-family', '"JetBrains Mono", monospace')
        .attr('font-weight', isTop ? 600 : 400)
        .text(frame.name + '()')

      // Line number
      fg.append('text')
        .attr('x', 14)
        .attr('y', frameH / 2 + 12)
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#4b5563')
        .attr('font-size', 10)
        .attr('font-family', '"JetBrains Mono", monospace')
        .text(`line ${frame.line}`)

      // "TOP" badge
      if (isTop) {
        fg.append('rect')
          .attr('x', W - 20 - 42)
          .attr('y', 10)
          .attr('width', 32)
          .attr('height', 16)
          .attr('rx', 3)
          .attr('fill', '#00e5ff18')
          .attr('stroke', '#00e5ff44')

        fg.append('text')
          .attr('x', W - 20 - 26)
          .attr('y', 18)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('fill', '#00e5ff')
          .attr('font-size', 9)
          .attr('font-family', '"Space Grotesk", sans-serif')
          .attr('font-weight', 700)
          .attr('letter-spacing', '0.06em')
          .text('TOP')
      }
    })

    // Stack base label
    g.append('text')
      .attr('x', (W - 20) / 2)
      .attr('y', frames.length * (frameH + frameGap) + 16)
      .attr('text-anchor', 'middle')
      .attr('fill', '#374151')
      .attr('font-size', 10)
      .attr('font-family', '"JetBrains Mono", monospace')
      .text('— bottom of stack —')
  }, [callStack, currentStep])

  return (
    <div className="panel flex flex-col" style={{ minHeight: 140 }}>
      <div className="panel-header">
        <span className="dot" style={{ background: '#00e5ff' }} />
        Call Stack
        <span className="tag tag-cyan" style={{ marginLeft: 'auto' }}>
          {callStack.length} frame{callStack.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <svg
          ref={svgRef}
          width="100%"
          style={{ minHeight: 80, overflow: 'visible' }}
        />
      </div>
    </div>
  )
}
