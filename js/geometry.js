// 几何计算工具 - 0°/45°/90° 角度约束路由
const Geometry = (() => {

  /**
   * 生成仅使用 0°/45°/90° 角度的折线路径
   * @param {number} x1 起点 X
   * @param {number} y1 起点 Y
   * @param {number} x2 终点 X
   * @param {number} y2 终点 Y
   * @returns {{x: number, y: number}[]} 路径点数组
   */
  function generatePath(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // 同一点
    if (absDx < 1 && absDy < 1) {
      return [{ x: x1, y: y1 }, { x: x2, y: y2 }];
    }

    // 纯水平或垂直
    if (absDy < 1) {
      return [{ x: x1, y: y1 }, { x: x2, y: y1 }];
    }
    if (absDx < 1) {
      return [{ x: x1, y: y1 }, { x: x1, y: y2 }];
    }

    const signX = dx > 0 ? 1 : -1;
    const signY = dy > 0 ? 1 : -1;

    let points;

    if (absDx >= absDy) {
      // 水平优先：水平 → 45° → 水平
      const h1 = (absDx - absDy) / 2;

      const p1 = { x: x1 + signX * h1, y: y1 };
      const p2 = { x: x1 + signX * (h1 + absDy), y: y2 };
      // 验证: p2.x = x1 + signX*(h1 + absDy) = x1 + signX*((absDx-absDy)/2 + absDy)
      //       = x1 + signX*((absDx+absDy)/2)
      // 由于 absDx >= absDy, h1+absDy >= h1, 这是正确的
      const p3 = { x: x2, y: y2 };

      points = [
        { x: x1, y: y1 },
        p1,
        p2,
        p3
      ];

      // 如果 h1 = 0，第一段和第二段起点重合，去掉重复点
      if (h1 < 0.5) {
        points = [{ x: x1, y: y1 }, p2, p3];
      }
      // 如果 h2 = 0 (即 absDx = absDy)，第三段退化，p2 = p3
      if (Math.abs(p2.x - p3.x) < 1 && Math.abs(p2.y - p3.y) < 1) {
        points = [{ x: x1, y: y1 }, p1, p2];
      }
    } else {
      // 垂直优先：垂直 → 45° → 垂直
      const v1 = (absDy - absDx) / 2;

      const p1 = { x: x1, y: y1 + signY * v1 };
      const p2 = { x: x2, y: y1 + signY * (v1 + absDx) };
      const p3 = { x: x2, y: y2 };

      points = [
        { x: x1, y: y1 },
        p1,
        p2,
        p3
      ];

      if (v1 < 0.5) {
        points = [{ x: x1, y: y1 }, p2, p3];
      }
      if (Math.abs(p2.x - p3.x) < 1 && Math.abs(p2.y - p3.y) < 1) {
        points = [{ x: x1, y: y1 }, p1, p2];
      }
    }

    // 简化路径（移除太近的点）
    return simplifyPath(points);
  }

  /**
   * 简化路径，移除距离太近的连续点
   */
  function simplifyPath(points, minDist = 2) {
    if (points.length <= 2) return points;

    const result = [points[0]];
    for (let i = 1; i < points.length; i++) {
      const last = result[result.length - 1];
      const curr = points[i];
      const dist = Math.hypot(curr.x - last.x, curr.y - last.y);
      if (dist >= minDist || i === points.length - 1) {
        result.push(curr);
      }
    }
    return result;
  }

  /**
   * 将路径点转换为 SVG path 数据
   */
  function pointsToPathData(points) {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    return d;
  }

  /**
   * 计算路径的总长度
   */
  function pathLength(points) {
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      length += Math.hypot(
        points[i].x - points[i - 1].x,
        points[i].y - points[i - 1].y
      );
    }
    return length;
  }

  /**
   * 计算路径中点（用于放置标签）
   */
  function pathMidpoint(points) {
    const totalLen = pathLength(points);
    const targetLen = totalLen / 2;
    let traversed = 0;

    for (let i = 1; i < points.length; i++) {
      const segLen = Math.hypot(
        points[i].x - points[i - 1].x,
        points[i].y - points[i - 1].y
      );
      if (traversed + segLen >= targetLen) {
        const t = (targetLen - traversed) / segLen;
        return {
          x: points[i - 1].x + t * (points[i].x - points[i - 1].x),
          y: points[i - 1].y + t * (points[i].y - points[i - 1].y)
        };
      }
      traversed += segLen;
    }

    return points[points.length - 1];
  }

  /**
   * 根据标签位置计算标签的偏移
   */
  function getLabelOffset(position, radius = 18) {
    const offsets = {
      'top':         { x: 0, y: -radius - 6, anchor: 'middle' },
      'bottom':      { x: 0, y: radius + 16, anchor: 'middle' },
      'left':        { x: -radius - 6, y: 4, anchor: 'end' },
      'right':       { x: radius + 6, y: 4, anchor: 'start' },
      'top-left':    { x: -radius - 4, y: -radius - 4, anchor: 'end' },
      'top-right':   { x: radius + 4, y: -radius - 4, anchor: 'start' },
      'bottom-left': { x: -radius - 4, y: radius + 16, anchor: 'end' },
      'bottom-right':{ x: radius + 4, y: radius + 16, anchor: 'start' }
    };
    return offsets[position] || offsets['top'];
  }

  /**
   * 计算两点之间的距离
   */
  function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
  }

  /**
   * 找距离指定点最近的站点
   */
  function findNearestStation(x, y, stations, maxDist = 30) {
    let nearest = null;
    let minDist = maxDist;

    for (const station of stations) {
      const d = distance(x, y, station.x, station.y);
      if (d < minDist) {
        minDist = d;
        nearest = station;
      }
    }

    return nearest;
  }

  /**
   * 找距离指定点最近的文本块
   */
  function findNearestTextBlock(x, y, textBlocks, maxDist = 20) {
    let nearest = null;
    let minDist = maxDist;

    for (const tb of textBlocks) {
      const d = distance(x, y, tb.x, tb.y);
      if (d < minDist) {
        minDist = d;
        nearest = tb;
      }
    }

    return nearest;
  }

  /**
   * 生成经过多个站点的完整折线路径
   * @param {{x:number,y:number}[]} stations 站点坐标数组
   * @returns {{x: number, y: number}[]} 路径点数组
   */
  function generateMultiStationPath(stations) {
    if (stations.length < 2) return stations.slice();
    let allPoints = [{ x: stations[0].x, y: stations[0].y }];
    for (let i = 1; i < stations.length; i++) {
      const seg = generatePath(stations[i - 1].x, stations[i - 1].y, stations[i].x, stations[i].y);
      allPoints = allPoints.concat(seg.slice(1));
    }
    return simplifyPath(allPoints);
  }

  return {
    generatePath,
    generateMultiStationPath,
    pointsToPathData,
    pathLength,
    pathMidpoint,
    getLabelOffset,
    distance,
    findNearestStation,
    findNearestTextBlock
  };
})();