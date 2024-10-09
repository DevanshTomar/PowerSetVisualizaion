import { prepareDataForBarChart } from "./barchart.js";

const attr1 = "restaurant type";
const attr2 = "cuisines type";
let pie_attr = attr1;

export default function drawPieChart(data, selectedIntersection, attribute) {
  if(attribute == attr1) {
    pie_attr = attr2;
  }
  else {
    pie_attr = attr1;
  }

  const pieChartData = prepareDataForPieChart(data, selectedIntersection, attribute);

  // console.log(pieChartData);
  createPieChart(pieChartData, data, pie_attr);
}


function prepareDataForPieChart(data, selectedIntersection, attribute) {
  let subsetData = [];

  const selectedIntersectionSet = new Set(selectedIntersection.split(", "));

  /**
  * Returns whether the selectedIntersection is a subset of the item
  * @param {Set} itemSet
  */
  function selectedIntersectionIsSubsetOf(itemSet) {
    for (let key of selectedIntersectionSet) {
        if (!itemSet.has(key)) {
          return false;
        }
    }
    return true;
  }

  data.forEach((d) => {
      const itemSet = new Set(d[attribute].split(', '));

      if (selectedIntersectionIsSubsetOf(itemSet)) {
        subsetData.push(d);
      }
  });

  let pieChartData;

  if(attribute == attr1) {
    pieChartData = prepareDataForBarChart(subsetData, attr2);
  }
  else if(attribute == attr2) {
    pieChartData = prepareDataForBarChart(subsetData, attr1);
  }

  return pieChartData;
}

function createPieChart(pieChartData, originalData, pie_attr) {
  let pie_chart = d3.pie()
    .value(function(d) {
      return d[1].frequency;
    });

  let pie_data = pie_chart(Object.entries(pieChartData));
  // console.log(pieChartData);
  // console.log(pie_data);
  let pieArcs = d3.arc()
    .innerRadius(0)
    .outerRadius(90);

  let x = 157;
  let y = 125;

  let allCategories = prepareDataForBarChart(originalData, pie_attr);

  let tooltip = d3.select("#tooltip")
    .attr("class", "tooltip")
    .style("opacity", 0);

  console.log(pieChartData.map((d) => d[pie_attr]));

  const color = d3
    .scaleOrdinal()
    .domain(allCategories.map(function(d) {
      return d[pie_attr];
    }))
    .range(d3.schemeTableau10);

  d3.select("#piechart_svg")
    .selectAll(".pie_slices")
    .data(pie_data)
    .join("path")
      .attr("class", "pie_slices")
      .attr("d", pieArcs)
      .attr("fill", function(d){
        return(color(d.data[1][pie_attr]));
      })
      .attr("transform", function(d) {
        return ("translate(" + x + "," + y + ")");
      })
      .style("stroke", "black")
      .style("stroke-width", "1px")
      .style("fill-opacity", 1)
      .on('mouseover', function(event, d) { // displays tooltip on mouseover
        d3.selectAll(".pie_slices").style("opacity", 0.4);
        d3.select(this).style("opacity", 1);

        tooltip.transition().duration(250).style("opacity", 1);
        tooltip
          .html(
            `<span style="font-size:14px;">${d.data[1][pie_attr]} : ${d.value}</span>`
          )
        .style("display", "block")
        .style("left", event.pageX + "px")
        .style("top", (event.pageY - 18) + "px");
      })
      .on('mousemove', function(event, d) {
        d3.selectAll(".pie_slices").style("opacity", 0.4);
        d3.select(this).style("opacity", 1);

        tooltip.transition().duration(250).style("opacity", 1);
        tooltip
          .html(
            `<span style="font-size:14px;">${d.data[1][pie_attr]} : ${d.value}</span>`
          )
        .style("display", "block")
        .style("left", event.pageX + "px")
        .style("top", (event.pageY - 18) + "px");
      })
      .on('mouseout', function(d) {
        d3.selectAll(".pie_slices").style("opacity", 1);

        tooltip
          .style("display", "none")
          .transition()
          .duration(250)
          .style("opacity", 0);
      });

  d3.select("#piechart_svg").append("text").text("Set System Compare: " + pie_attr).attr("text-anchor", "middle").attr("x", "50%").attr("y", 20);
}
