import { prepareDataForTreemap } from "./treemap.js";
import { createTreemap } from "./treemap.js";
import { updateTreemap } from "./treemap.js";

let widths = [0];
let heights = [0];
let originalData;
let selected_attribute;
let multiMapData;
let select;

export default function drawMultiTreeMap(data, attribute, minIntersect, selection) {
    originalData = data;
    selected_attribute = attribute;
    select = selection;
    let exclusive = true; // TODO user selects exclusivity
    multiMapData = prepareDataForMultiTreemap(data, attribute, minIntersect);
    const proportionCounts = getDegreePorportionCounts(multiMapData);
    createMultiTreemap(multiMapData, proportionCounts, exclusive);
}

function prepareDataForMultiTreemap(data, attribute, minIntersect) {
    let multiMapData = [];
    let currDegree = 0;
    const placeholder = {
        name: attribute + "-0",
        children: [],
    }
    multiMapData.push(placeholder);

    currDegree += 1;

    while(true) {
        let newData = prepareDataForTreemap(data, attribute, currDegree, minIntersect);
        if(newData.children.length != 0) {
            multiMapData.push(newData);
        }
        else {
            break;
        }
        currDegree += 1;
    }

    return multiMapData;
}

// used for getting a count of all elements in each degree
// proportionCount[0] is the total number of elements
// proportionCount[degree] is the number of elements in that degree
function getDegreePorportionCounts(data) { 
    let proportionCounts = [];
    proportionCounts.push(0);
    let degree = 1;
    let totalCount = 0;

    while(degree < data.length) {
        let count = 0;
        data[degree].children.forEach((element) => {
            count += element.value;
            totalCount += element.value;
        });
        proportionCounts.push(count);

        degree += 1;
    }

    proportionCounts[0] = totalCount;

    return proportionCounts;
}

function createMultiTreemap(data, proportionCounts, exclusive) {
    // d3.select("#treemap_svg").selectAll("*").remove();

    const xOffset = 50;
    const width = 815 - xOffset; // 815 - buffer for degree numbers
    const height = 600;
    const buffer = 5;
    const minHeight = 10;
    let usedHeight = 5;
    const usableHeight = (height - usedHeight - ((proportionCounts.length - 2) * buffer)) * 0.95

    let sidebar_svg = d3
        .select("#treemap_svg")
        .append("svg")
        .attr("width", xOffset)
        .attr("height", height)
        .style("font-family", "sans-serif")
        .style("font-size", "12px");

    let degree = 1;
    while(degree < data.length) {
        const proportion = proportionCounts[degree]/proportionCounts[0] 
        let svgWidth = width;
        let svgHeight = 0;
        let svgXOffset = xOffset;
        let svgYOffset = usedHeight;

        if (proportion * usableHeight > minHeight) {
            svgHeight = proportion * usableHeight;
        }
        else {
            svgHeight = minHeight;
            svgWidth = (proportion * usableHeight * width)/minHeight
        }

        let svg = d3
            .select("#treemap_svg")
            .append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .attr("x", svgXOffset)
            .attr("y", svgYOffset)
            .attr("class", "svg-" + degree)
            .style("font-family", "sans-serif")
            .style("font-size", "12px");

        createTreemap(data[degree], originalData, selected_attribute, degree, svgWidth, svgHeight, svg, select, exclusive);
        widths.push(svgWidth+0);
        heights.push(svgHeight+0);

        let dropdownHeight = Math.round(((usedHeight) + ((svgHeight)/2) + 3));

        // add number and dropdown triangle to sidebar
        sidebar_svg
            .append("text")
            .attr("x", 6)
            .attr("y", dropdownHeight)
            .attr("class", "text-" + degree)
            .text(degree);

        let triangle = d3.symbol().type(d3.symbolTriangle).size(80);
        let triangleTranslate = 30;
        let transformString = "translate(" + triangleTranslate + "," + (dropdownHeight - 5) + ")rotate(180)";

        const newDegree = degree + 0;

        sidebar_svg
            .append("path")
            .attr("d", triangle)
            .attr("class", "triangle-" + degree)
            .attr("fill", "grey")
            .attr("transform", transformString)
            .on("click", function() {
                collapseMultiMap(data, proportionCounts, newDegree);
            });

        usedHeight += (svgHeight + buffer);
        degree += 1;
    }

    // collapse the multi treemap, triggers when a down-facing triangle is clicked
    function collapseMultiMap(data, proportionCounts, limitDegree) { 
        console.log("collapsing " + limitDegree);

        let proportionTotal = 0;
        for(let proportionDegree = limitDegree + 1; proportionDegree < data.length; proportionDegree += 1) {
            proportionTotal += proportionCounts[proportionDegree];
        }

        const xOffset = 50;
        const width = 815 - xOffset; // 815 - buffer for degree numbers
        const height = 600;
        const buffer = 5;
        const minHeight = 10;
        let usedHeight = 5;
        const usableHeight = (height - usedHeight - ((proportionCounts.length - 2) * buffer) - (limitDegree * minHeight)) * 0.95
        
        let currentDegree = 1;
        while(currentDegree < data.length) {
            // collapse the values that are less than or equal to the collapsed triangle degree
            if(currentDegree <= limitDegree) {
                d3.select(".svg-" + currentDegree).transition()
                    .duration(1000)
                    .attr("height", minHeight)
                    .attr("y", usedHeight);

                let dropdownHeight = Math.round(((usedHeight) + ((minHeight)/2) + 3));

                d3.select(".text-" + currentDegree).transition()
                    .duration(1000)
                    .attr("y", dropdownHeight);

                let triangleTranslate = 30;
                let transformString = "translate(" + triangleTranslate + "," + (dropdownHeight - 5) + ")rotate(90)";

                d3.select(".triangle-" + currentDegree).transition()
                    .duration(1000)
                    .attr("transform", transformString);

                updateTreemap(data[currentDegree], currentDegree, width, minHeight);
                widths[currentDegree] = width+0;
                heights[currentDegree] = minHeight+0;

                usedHeight += (minHeight + buffer);
            }
            else { // expand everything else to fill the newly-freed space
                const proportion = proportionCounts[currentDegree]/proportionTotal;
                let svgWidth = width;
                let svgHeight = 0;
                let svgXOffset = xOffset;
                let svgYOffset = usedHeight;

                if (proportion * usableHeight > minHeight) {
                    svgHeight = proportion * usableHeight;
                }
                else {
                    svgHeight = minHeight;
                    svgWidth = (proportion * usableHeight * width)/minHeight
                }

                d3.select(".svg-" + currentDegree).transition()
                    .duration(1000)
                    .attr("height", svgHeight)
                    .attr("width", svgWidth)
                    .attr("x", svgXOffset)
                    .attr("y", svgYOffset);

                let dropdownHeight = Math.round(((usedHeight) + ((svgHeight)/2) + 3));

                d3.select(".text-" + currentDegree).transition()
                    .duration(1000)
                    .attr("y", dropdownHeight);
    
                let triangleTranslate = 30;
                let transformString = "translate(" + triangleTranslate + "," + (dropdownHeight - 5) + ")rotate(180)";
    
                d3.select(".triangle-" + currentDegree).transition()
                    .duration(1000)
                    .attr("transform", transformString);

                updateTreemap(data[currentDegree], currentDegree, svgWidth, svgHeight);
                widths[currentDegree] = svgWidth+0;
                heights[currentDegree] = svgHeight+0;

                usedHeight += (svgHeight + buffer);
            }

            currentDegree += 1;
        }

        // wait one second for the animations to finish, then redraw the non-shrunk trees to add the text (and for consistency)
        currentDegree = limitDegree + 1;
        usedHeight = 5 + (limitDegree * minHeight) + (limitDegree * buffer);

        sleep(1000).then(() => {

        while(currentDegree < data.length) {
            const proportion = proportionCounts[currentDegree]/proportionTotal;
            let svgWidth = width;
            let svgHeight = 0;
            let svgXOffset = xOffset;
            let svgYOffset = usedHeight;

            if (proportion * usableHeight > minHeight) {
                svgHeight = proportion * usableHeight;
            }
            else {
                svgHeight = minHeight;
                svgWidth = (proportion * usableHeight * width)/minHeight
            }

            const svg = d3.select(".svg-" + currentDegree);
            createTreemap(data[currentDegree], originalData, selected_attribute, currentDegree, svgWidth, svgHeight, svg, select, exclusive);

            usedHeight += (svgHeight + buffer);

            currentDegree += 1;
        }
        
        currentDegree = 1;
        while(currentDegree < data.length) {
            const newCurrentDegree = currentDegree + 0;

            if(currentDegree <= limitDegree) {
                d3.select(".triangle-" + currentDegree)
                    .on("click", function() {
                        expandMultiMap(data, proportionCounts, newCurrentDegree);
                    });
            }
            else {
                d3.select(".triangle-" + currentDegree)
                    .on("click", function() {
                        collapseMultiMap(data, proportionCounts, newCurrentDegree);
                    });
            }

            currentDegree += 1;
        }
        });

    }

    // expands the multimap, triggers when a right-facing triangle is clicked
    function expandMultiMap(data, proportionCounts, limitDegree) {
        console.log("expanding " + limitDegree);

        let proportionTotal = 0;
        for(let proportionDegree = limitDegree; proportionDegree < data.length; proportionDegree += 1) {
            proportionTotal += proportionCounts[proportionDegree];
        }

        const xOffset = 50;
        const width = 815 - xOffset; // 815 - buffer for degree numbers
        const height = 600;
        const buffer = 5;
        const minHeight = 10;
        let usedHeight = 5;
        const usableHeight = (height - usedHeight - ((proportionCounts.length - 2) * buffer) - ((limitDegree - 1) * minHeight)) * 0.95
        
        let currentDegree = 1;
        while(currentDegree < data.length) {
            // keep anything above the to-be-expanded box collapsed
            if(currentDegree < limitDegree) {
                d3.select(".svg-" + currentDegree).transition()
                    .duration(1000)
                    .attr("height", minHeight)
                    .attr("y", usedHeight);

                let dropdownHeight = Math.round(((usedHeight) + ((minHeight)/2) + 3));

                d3.select(".text-" + currentDegree).transition()
                    .duration(1000)
                    .attr("y", dropdownHeight);

                let triangleTranslate = 30;
                let transformString = "translate(" + triangleTranslate + "," + (dropdownHeight - 5) + ")rotate(90)";

                d3.select(".triangle-" + currentDegree).transition()
                    .duration(1000)
                    .attr("transform", transformString);

                updateTreemap(data[currentDegree], currentDegree, width, minHeight);
                widths[currentDegree] = width+0;
                heights[currentDegree] = minHeight+0;

                usedHeight += (minHeight + buffer);
            }
            else { //expand the rest to fill the space
                const proportion = proportionCounts[currentDegree]/proportionTotal;
                let svgWidth = width;
                let svgHeight = 0;
                let svgXOffset = xOffset;
                let svgYOffset = usedHeight;

                if (proportion * usableHeight > minHeight) {
                    svgHeight = proportion * usableHeight;
                }
                else {
                    svgHeight = minHeight;
                    svgWidth = (proportion * usableHeight * width)/minHeight
                }

                d3.select(".svg-" + currentDegree).transition()
                    .duration(1000)
                    .attr("height", svgHeight)
                    .attr("width", svgWidth)
                    .attr("x", svgXOffset)
                    .attr("y", svgYOffset);

                let dropdownHeight = Math.round(((usedHeight) + ((svgHeight)/2) + 3));

                d3.select(".text-" + currentDegree).transition()
                    .duration(1000)
                    .attr("y", dropdownHeight);
    
                let triangleTranslate = 30;
                let transformString = "translate(" + triangleTranslate + "," + (dropdownHeight - 5) + ")rotate(180)";
    
                d3.select(".triangle-" + currentDegree).transition()
                    .duration(1000)
                    .attr("transform", transformString);

                updateTreemap(data[currentDegree], currentDegree, svgWidth, svgHeight);
                widths[currentDegree] = svgWidth+0;
                heights[currentDegree] = svgHeight+0;

                usedHeight += (svgHeight + buffer);
            }

            currentDegree += 1;
        }

        // wait one second, then redraw the expanded treemaps for consistency and to add the text back
        currentDegree = limitDegree;
        usedHeight = 5 + ((limitDegree - 1) * minHeight) + ((limitDegree - 1) * buffer);

        sleep(1000).then(() => {

            while(currentDegree < data.length) {
                const proportion = proportionCounts[currentDegree]/proportionTotal;
                let svgWidth = width;
                let svgHeight = 0;
                let svgXOffset = xOffset;
                let svgYOffset = usedHeight;
    
                if (proportion * usableHeight > minHeight) {
                    svgHeight = proportion * usableHeight;
                }
                else {
                    svgHeight = minHeight;
                    svgWidth = (proportion * usableHeight * width)/minHeight
                }
    
                const svg = d3.select(".svg-" + currentDegree);
                createTreemap(data[currentDegree], originalData, selected_attribute, currentDegree, svgWidth, svgHeight, svg, select, exclusive);
    
                usedHeight += (svgHeight + buffer);
    
                currentDegree += 1;
            }

            currentDegree = 1;
            while(currentDegree < data.length) {

                const newCurrentDegree = currentDegree + 0;

                if(currentDegree < limitDegree) {
                    d3.select(".triangle-" + currentDegree)
                        .on("click", function() {
                            expandMultiMap(data, proportionCounts, newCurrentDegree);
                        });
                }   
                else {
                    d3.select(".triangle-" + currentDegree)
                        .on("click", function() {
                            collapseMultiMap(data, proportionCounts, newCurrentDegree);
                        });
                }

                currentDegree += 1;
            }
        });
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function highlightMultiTreeMap(selection) {
    select = selection;
    let exclusive = true;

    let currentDegree = 1;
    while(currentDegree < multiMapData.length) {
        let svg = d3.select(".svg-" + currentDegree);

        createTreemap(multiMapData[currentDegree], originalData, selected_attribute, currentDegree, widths[currentDegree], heights[currentDegree], svg, select, exclusive);

        currentDegree += 1;
    }
}

export function resetWidthHeight() {
    widths = [0];
    heights = [0];
}
