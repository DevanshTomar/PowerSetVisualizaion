export default function drawHistogramAndTable(data, selectedIntersection, attribute) {
  const {  histogramData, tableData } = filterData(data, selectedIntersection, attribute);

  createHistogram(histogramData);
  
  createTable(tableData);
}

function createTable(tableData) {
  var table = document.createElement("table");
  var thead = document.createElement("thead");
  var tr = document.createElement("tr");

  var keys = Object.keys(tableData[0]);
  keys.forEach(function (key) {
    var th = document.createElement("th");
    th.textContent = key;
    th.title = key;
    tr.appendChild(th);
  });

  thead.appendChild(tr);
  table.appendChild(thead);

  var tbody = document.createElement("tbody");

  tableData.forEach(function (obj) {
    var tr = document.createElement("tr");
    keys.forEach(function (key) {
      var td = document.createElement("td");
      td.textContent = obj[key];
      td.title = obj[key];
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);

  document.getElementById("tableContainer").innerHTML = "";
  document.getElementById("tableContainer").appendChild(table);
  document.getElementById("tableContainer").style.display = "block";
}


function filterData(data, selectedIntersection, attribute) {

  let ratings = {
      '[0-1)': 0,
      '[1-2)': 0,
      '[2-3)': 0,
      '[3-4)': 0,
      '[4-5)': 0
  };

  let tableData = [];

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

          const rating = parseFloat(d['rate (out of 5)']);

          if (rating >= 0 && rating < 1) {
              ratings["[0-1)"]++;
          } else if (rating >= 1 && rating < 2) {
              ratings["[1-2)"]++;
          } else if (rating >= 2 && rating < 3) {
              ratings['[2-3)']++;
          } else if (rating >= 3 && rating < 4) {
              ratings["[3-4)"]++;
          } else {
              ratings["[4-5)"]++;
          }

          tableData.push({
          "Name": d["restaurant name"],
          Cuisine: d["cuisines type"],
          "Restaurant Type": d["restaurant type"],
          "Rate (out of 5)": d["rate (out of 5)"],
          // "Number of Orders": d["num of ratings"],
          });
      }
  });

  let histogramData = [];

  Object.keys(ratings).forEach((d) => {
    histogramData.push({
      key: d,
      value: ratings[d],
    });
  });

  return { histogramData, tableData };
}


function createHistogram(histogramData) {
  const margin = { top: 32, right: 20, bottom: 125, left: 50 };
  const width = 315 - margin.left - margin.right;
  const height = 325 - margin.top - margin.bottom;

  let svg = d3.select("#histogram_svg");

  svg.selectAll("*").remove("");

  svg = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  let tooltip = d3
    .select("#tooltip")
    .attr("class", "tooltip")
    .style("opacity", 0);

  const x = d3
    .scaleBand()
    .range([0, width])
    .domain(histogramData.map((d) => d.key))
    .padding(0.2);

  svg
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-7)")
    .style("text-anchor", "start");

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(histogramData, (d) => d.value)])
    .range([height, 0]);

  svg.append("g").call(d3.axisLeft(y));

  svg
    .selectAll(".barsClass")
    .data(histogramData)
    .enter()
    .append("rect")
    .attr("class", "hrects")
    .style("fill", "#69b3a2")
    .attr("x", (d) => x(d.key))
    .attr("y", (d) => y(d.value))
    .attr("width", x.bandwidth())
    .attr("height", (d) => Math.max(0, height - y(d.value)))
    .on("mouseover", function (event, d) {
      d3.selectAll(".hrects").style("opacity", 0.4);
      d3.select(this).style("opacity", 1);

      tooltip.transition().duration(250).style("opacity", 1);
      tooltip
        .html(
          `<span style="font-size:14px;">${d.key} : ${d.value}</span>`
        )
      .style("display", "block")
      .style("left", event.pageX + "px")
      .style("top", (event.pageY - 18) + "px");
    })
    .on('mousemove', function(event, d) {
      d3.selectAll(".hrects").style("opacity", 0.4);
      d3.select(this).style("opacity", 1);

      tooltip.transition().duration(250).style("opacity", 1);
      tooltip
        .html(
          `<span style="font-size:14px;">${d.key} : ${d.value}</span>`
        )
      .style("display", "block")
      .style("left", event.pageX + "px")
      .style("top", (event.pageY - 18) + "px");
    })
    .on("mouseout", function (i, d) {
      d3.selectAll(".hrects").style("opacity", 1);

      tooltip
        .style("display", "none")
        .transition()
        .duration(250)
        .style("opacity", 0);
    });

  svg.append("text").text("Ratings").attr("x", '80').attr("y", "-10");
}