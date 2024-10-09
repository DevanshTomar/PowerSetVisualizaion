import drawHistogramAndTable from "./histogram.js";
import drawPieChart from "./piechart.js";

export default function drawTreeMap(data, attribute, degree) {
  const treemapData = prepareDataForTreemap(data, attribute, degree);
  createTreemap(treemapData);
}

function containsVal(select, data, exclusive) {
  if (select === null) {
    return false;
  } 

  if (select.length === 0) {
    return false;
  }

  // //------- AND/EXCLUSIVE CASE---------

  if (exclusive == true) {
    var flag = false;
    var value = data.data.name;
    select.forEach(function(row) {
      // flag = true;
      if (value.indexOf(row) == -1) {
        flag = true;
      }
    })
  }

  //-------- OR/INCLUSIVE CASE---------

  else {
    var flag = true;
    var value = data.data.name;
    select.forEach(function(row) {
      // flag = true;
      if (value.includes(row)) {
        flag = false;
      }
    })
  }
  return flag;
}

export function prepareDataForTreemap(data, attribute, degree, minIntersect) {

    function generateAllPossibleIntersections(types, degree) {
        let result = [];
        
        // Recursive function to generate combinations
        function backtrack(start, currentCombination) {
            if (currentCombination.length === degree) {
                result.push(currentCombination.slice()); // Add a copy of the current combination
                return;
            }
            
            for (let i = start; i < types.length; i++) {
                currentCombination.push(types[i]); // Include the current element in the combination
                backtrack(i + 1, currentCombination); // Recur with the next index
                currentCombination.pop(); // Backtrack by removing the current element
            }
        }
        
        backtrack(0, []); // Start with an empty combination at index 0
        return result;
    }

    // Transform data to create a hierarchical structure based on attribute
    const filteredData = data.filter((row) =>
      row[attribute].split(',').length >= degree
    );

    // Transform filtered data to create a hierarchical structure
    const root = {
      name: attribute + "-" + degree,
      children: [],
    };

    const intersectionCounts = {};

    filteredData.forEach((row) => {
      const types = row[attribute].trim().split(', ').sort();

      const allPossibleIntersections = generateAllPossibleIntersections(types, degree);

      allPossibleIntersections.forEach(intersection => {
          const intersectionKey = intersection.sort().join(', ');
          if (!intersectionCounts[intersectionKey]) {
            intersectionCounts[intersectionKey] = { name: intersectionKey, value: 0 };
          }
          intersectionCounts[intersectionKey].value += 1;
      });
    });

    const filteredIntersectionCounts = Object.values(intersectionCounts).filter(function(obj) {
      return obj.value >= minIntersect;
    }); 

    root.children = Object.values(filteredIntersectionCounts);

    return root;
}

export function createTreemap(data, originalData, attribute, degree, width, height, svg, select, exclusive) {
  svg.selectAll("*").remove();

  // const width = 815, height = 600;
  const format = d3.format(",d");
  const color = d3
    .scaleOrdinal()
    .domain(data.children.map((d) => d.name))
    .range(d3.schemeTableau10);

  const treemap = d3.treemap().size([width, height]).padding(1).round(true);

  const root = d3
    .hierarchy(data)
    .sum((d) => d.value)
    .sort((a, b) => b.value - a.value);

  treemap(root);

  // const svg = d3
  //   .select("#treemap_svg")
  //   .append("svg")
  //   .attr("width", width)
  //   .attr("height", height)
  //   .style("font-family", "sans-serif")
  //   .style("font-size", "12px");

  const shapeGroup = svg.append("g")
    .attr("class", "shapeGroup-" + degree);

  const leaf = shapeGroup
    .selectAll("g")
    .data(root.leaves())
    .join("g")
    .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

  leaf
    .append("rect")
    .attr("class", "leafs")
    .attr("fill", (d) => color(d.data.name))
    .attr("width", (d) => d.x1 - d.x0)
    .attr("height", (d) => d.y1 - d.y0)
    .on("click", function (i, d) {
      drawHistogramAndTable(originalData, d.data.name, attribute);
      drawPieChart(originalData, d.data.name, attribute);
    })
    .filter(function(d) {
      return containsVal(select, d, exclusive);
    })
    .style("opacity", "30%");

  leaf
    .append("text")
    .selectAll("tspan")
    .data(function(d) {
      if((d.x1 - d.x0) >= 50 && (d.y1 - d.y0) >= 20) {
        return d.data.name.split(/, /);
      }
      else {
        return [""];
      }
    })
    .join("tspan")
    .attr("x", 3)
    .attr("y", (d, i) => `${i + 1}em`)
    .text((d) => d);

  leaf.append("title").text((d) => `${d.data.name}\n${format(d.value)}`);
}

export function updateTreemap(data, degree, width, height) {
  const format = d3.format(",d");

  const treemap = d3.treemap().size([width, height]).padding(1).round(true);

  const root = d3
    .hierarchy(data)
    .sum((d) => d.value)
    .sort((a, b) => b.value - a.value);

  treemap(root);

  const shapeGroup = d3.select(".shapeGroup-" + degree);

  const leaf = shapeGroup
    .selectAll("g")
    .data(root.leaves())
    .join("g")
    .transition()
      .duration(1000)
      .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

  shapeGroup
    .selectAll("rect")
    .data(root.leaves())
      .transition()
      .duration(1000)
      .attr("width", function(d) {
        return d.x1 - d.x0;
      })
      .attr("height", (d) => d.y1 - d.y0);

  shapeGroup
    .selectAll("text").remove();
}
