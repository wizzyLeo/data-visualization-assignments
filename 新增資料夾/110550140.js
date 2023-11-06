import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
const file_path = "air-pollution.csv";

// parse the data from the csv file
function parseSeries(data) {
    // First, create a set of unique district values from the data
    const districts = new Set(data.map((d) => d["Station code"])); // assuming 'Station code' can be used as district identifier
    // print the type of district
    console.log("type:", typeof(districts));
    const series = {};
    districts.forEach((district) => {
        // Filter data for the current district
        const districtData = data.filter((d) => d["Station code"] === district);

        // Create an object for each district where each key is a pollutant and the value is sorted data for that pollutant
        series[district] = {};
        const pollutants = ["SO2", "CO", "O3", "NO2", "PM10", "PM2.5"];
        pollutants.forEach((pollutant) => {
            series[district][pollutant] = districtData.map(cur => ({
                date: new Date(cur["Measurement date"]),
                value: +cur[pollutant]
            })).sort((a, b) => a.date - b.date);
        });
    });
    return series;
}

function populateSelect(series){
    const districtSelect = document.getElementById("district-select");
    const pollutantSelect = document.getElementById("pollutant-select");
    const districts = Object.keys(series);
    const pollutants = Object.keys(series[districts[0]]);
    districts.forEach(district => {
        const option = document.createElement("option");
        option.value = district;
        option.text = district;
        districtSelect.appendChild(option);
    });
    pollutants.forEach(pollutant => {
        const option = document.createElement("option");
        option.value = pollutant;
        option.text = pollutant;
        pollutantSelect.appendChild(option);
    });
}

function getSelectValue(){
    const district = document.getElementById("district-select").value;
    const pollutant = document.getElementById("pollutant-select").value;
    return {
        district: district,
        pollutant: pollutant
    };
}

function renderLine(series){
    const district = document.getElementById("district-select").value || "101";
    const pollutant = document.getElementById("pollutant-select").value || "PM10";
    const data = series[district][pollutant];
    console.log('data: ', data);

    const margin = { top: 30, right: 10, bottom: 0, left: 10 };
    // set height and width to the size of container
    const container = document.getElementById("line-container");
    d3.select(container).select('svg').remove();
    const boxWidth = container.clientWidth;
    const boxHeight = container.clientHeight;
    const width = boxWidth - margin.left - margin.right;
    const height = (boxHeight - margin.top - margin.bottom)/2;
    const padding = 1;

    const svg = d3.select(container)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

        console.log("width", width);
        console.log("height", height);
        const x = d3.scaleTime()
            .domain(d3.extent(data, d=>d.date))
            .range([0, width]);
        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d=>d.value)])
            .range([height/2, -height/2]);
        const area = d3.area()
            .x(d => x(d.date))
            .y0(height)
            .y1(d => y(d.value));
        
        const baseHue = 240;
        const saturationScale = d3.scaleLinear()
            .domain(d3.extent(data, d=>d.value))
            .range([0.3, 1]);
        svg.append("path")
            .datum(data)
            .attr("fill", "#cce5df")
            .attr("stroke", "#69b3a2")
            .attr("stroke-width", 1.5)
            .attr("d", area)

}

function renderHorizon(series){
    
}

function showLoading(){
    const loading = document.querySelectorAll(".loading-container");
    loading.forEach(loading => {
        loading.style.display = "block";
    });
}
function hideLoading(){
    const loading = document.querySelectorAll(".loading-container");
    loading.forEach(loading => {
        loading.style.display = "none";
    });
}

let series;

function renderDashboard(){
    if(series){
        renderLine(series);
    }else{
        showLoading();
        d3.csv(file_path).then((data) => {
            hideLoading();
            series = parseSeries(data);
            populateSelect(series);
            console.log(series);
            renderLine(series);
        }).catch(err => {
            console.log(err);
        });
    }
}


renderDashboard();


