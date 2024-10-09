import drawBarChart from "./barchart.js";
import drawTreeMap from "./treemap.js";
import drawMultiTreeMap from "./multi_treemap.js";
import { selectHistogram, selectPie, selectRestaurant, selectCuisine, sliderChange } from "./support.js";

const attr1 = "restaurant type";
const attr2 = "cuisines type";
let filter_limit = 10;

// TODO selectors for barchart exclusivity, minimum intersections

document.addEventListener('DOMContentLoaded', function () {
    d3.select("#slide_div").append("text")
        .attr("class", "slide_text")
        .text(filter_limit);
    d3.csv("./zomato.csv").then(data => {
        drawMultiTreeMap(data, attr2, 10, null); // data, attribute, minimum intersections required for a square to be shown, selected barchart tiles
        drawBarChart(data, attr2, 10);
    });
});

let radios = document.radioForm.click_chart_select;
radios[0].addEventListener('change', function() { // histogram selected
    selectHistogram();
});
radios[1].addEventListener('change', function() {
    selectPie();
});

let set_select = document.set_select_form.set_system_select;
set_select.addEventListener('change', function() {
    if (this.selectedOptions[0].value == "restaurant") {
        selectRestaurant();
    }
    else if (this.selectedOptions[0].value == "cuisine") {
        selectCuisine();
    }
});

let intersection_slider = document.slide_form.intersection_slider;
intersection_slider.addEventListener('input', function() {
    let slide_text = d3.select(".slide_text");
    slide_text.text(this.value);
});
intersection_slider.addEventListener('change', function() {
    sliderChange(this.valueAsNumber);
});
