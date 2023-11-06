import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
const file_path = "http://vis.lab.djosix.com:2023/data/air-pollution.csv";

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
    districtSelect.value = "119";
    pollutantSelect.value = "PM10";
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
    const district = document.getElementById("district-select").value || "119";
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
            .attr("d", d3.area()
                .x(d => x(d.date))
                .y0(height)
                .y1(height));
        svg.selectAll("path")
            .transition()
            .duration(800)
            .attr("d", area)
            .delay((d, i) => i);
}

function renderHorizonChart(data) {
    // Retrieve the selected district and pollutant from dropdowns
    const selectedDistrict = document.getElementById("district-select").value || "119";
    const selectedPollutant = document.getElementById("pollutant-select").value || "PM10";

    console.log("Horizon chart rendering for District:", selectedDistrict, "Pollutant:", selectedPollutant);

    // Filter and process data for the selected district and pollutant
    data = data.filter(d => d["Station code"] === selectedDistrict)
        .map(d => ({
            date: new Date(d['Measurement date']),
            value: +d[selectedPollutant]
        }));

    console.log("Processed data (horizon chart):", data);

    // Chart dimensions
    const size = 25;
    const margin = { top: 30, right: 10, bottom: 0, left: 10 };
    const containerWidth = d3.select("#horizon-container").node().getBoundingClientRect().width;
    const width = containerWidth - margin.left - margin.right;
    const height = 250; // Updated to a fixed height suitable for a single series

    // Scales for the chart
    const x = d3.scaleUtc()
        .domain(d3.extent(data, d => d.date))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value)])
        .range([0, size*4]);

    // Area generator
    const areaAbove1 = d3.area()
        .x(d => x(d.date))
        .y0(size)
        .y1(d => Math.max(size*2, y(d.value)));
    const areaAbove2 = d3.area()
        .x(d => x(d.date))
        .y0(size*2)
        .y1(d => Math.max(size*2, y(d.value)));
    const areaBelow1 = d3.area()
        .x(d => x(d.date))
        .y0(size)
        .y1(d => Math.min(size*2, y(d.value)));
    const areaBelow2 = d3.area()
        .x(d => x(d.date))
        .y0(size*2)
        .y1(d => Math.min(size*2, y(d.value)));

    // Create SVG container
    const svg = d3.select("#horizon-container")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height}`)
        .attr("style", "max-width: 85%; height: auto; font: 10px sans-serif;");


    // Append the area path to the SVG
    const g = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top+100})`);
    g.append("path").datum(data).attr("d", areaAbove1).attr("fill", "#1e8beb");
    g.append("path").datum(data).attr("d", areaAbove2).attr("fill", "red").style("opacity", 0.5);
    g.append("path").datum(data).attr("d", areaBelow1).attr("fill", "#9fc9ed").style("opacity", 0.4);
    g.append("path").datum(data).attr("d", areaBelow2).attr("fill", "#bbd6ed").style("opacity", 0.3);

    // Add the horizontal axis
    svg.append("g")
        .attr("transform", `translate(0,${margin.top})`)
        .call(d3.axisTop(x).ticks(width / 80).tickSizeOuter(0))
        .call(g => g.selectAll(".tick").filter(d => x(d) < margin.left || x(d) >= width - margin.right).remove())
        .call(g => g.select(".domain").remove());

    // Return the SVG node for Observable notebooks
    return svg.node();
}


function showLoading(){
    const loading = document.querySelectorAll(".loading-container");
    loading.forEach(loading => {
        loading.style.display = "block";
    });
}
function hideLoading(){
    const loading = document.querySelectorAll(".loading-container");
    console.log("Number of loading to close", loading.length);
    loading.forEach(loading => {
        loading.style.display = "none";
    });
}

function renderBarChart(data){
    const pollutant = document.getElementById("pollutant-select").value || "PM10";
    // count the history average of the value of the pollutant in each district
    const avg = [];
    const districts = new Set(data.map((d) => d["Station code"]));
    districts.forEach(district => {
        const districtData = data.filter((d) => d["Station code"] === district);
        const pollutantAvg = d3.mean(districtData, d => d[pollutant]);
        avg.push({
            district: district,
            value: pollutantAvg
        });
    })

    

    const boxWidth = document.getElementById("bar-container").clientWidth;
    const boxHeight = document.getElementById("bar-container").clientHeight;
    const margin = { top: 30, right: 30, bottom: 70, left: 60 },
        width = boxWidth - margin.left - margin.right,
        height = boxHeight - margin.top - margin.bottom;
    const svg = d3.select("#bar-container")
        .append("svg")
            .attr("width", boxWidth)
            .attr("height", boxHeight)
        .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);
    const x = d3.scaleBand()
        .range([0, width])
        .domain(districts)
        .padding(0.2);
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");
    const y = d3.scaleLinear()
        .domain([0, d3.max(avg, d => d.value)])
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));
    
    svg.selectAll("bar")
        .data(avg).enter()
        .append("rect")
            .attr("x", (d) => x(d.district))
            .attr("width", x.bandwidth())
            .attr("fill", "#69b3a2")
            .attr("height", (d) => height - y(0))
            .attr("y", (d) => y(0));
    svg.selectAll("rect")
        .transition()
        .duration(800)
        .attr("y", (d) => y(d.value))
        .attr("height", (d) => height - y(d.value))
        .delay((d, i) => i * 100);   
    // add the average value to the top of each bar
    svg.selectAll("text")
        .data(avg).enter()
        .append("text")
            .attr("x", (d) => x(d.district) + x.bandwidth() / 2)
            .attr("y", (d) => y(d.value) - 20)
            .attr("text-anchor", "middle")
            .text((d) => d.value.toFixed(2)); 
}

let series;
let data;
let code2Address;
function selectThirdString(str){
    const parts = str.split(",");
    if(parts.length >= 3){
        return parts[2];
    }else{
        return null;
    }
}

function renderDashboard(){
    clearAllSVGs();
    
    if(series){
        renderLine(series);
        renderHorizonChart(data)
        renderBarChart(data);
        const currentArea = document.getElementById("current-area");
        console.log(code2Address[(getSelectValue().district)]);
        currentArea.textContent = code2Address[(getSelectValue().district)];
        console.log(currentArea.value, "This is the value of current area");
    }else{
        showLoading();
        d3.csv(file_path).then((d) => {
            hideLoading();
            data = d;
            series = parseSeries(d);
            populateSelect(series);
            console.log(series);
            renderLine(series);
            renderHorizonChart(d);
            renderBarChart(d);
            // build a map from station code to address
            code2Address = {};
            const districts = new Set(data.map((d) => d["Station code"]));
            districts.forEach(district => {
                const districtData = data.filter((d) => d["Station code"] === district);
                code2Address[district] = selectThirdString(districtData[0]["Address"]);
            });
            const currentArea = document.getElementById("current-area");
            currentArea.textContent = code2Address[(getSelectValue().district)];
        }).catch(err => {
            console.log(err);
        });
    }
}

function clearAllSVGs() {
    // List all container IDs or class names
    const containerIds = ["line-container", "horizon-container", "bar-container"];
    
    containerIds.forEach(id => {
        const container = d3.select(`#${id}`);
        container.selectAll("svg").remove();
    });
}


// add a evemt listener to both selects
function changeSelect(){
    const districtSelect = document.getElementById("district-select");
    const pollutantSelect = document.getElementById("pollutant-select");
    districtSelect.addEventListener("change", renderDashboard);
    pollutantSelect.addEventListener("change", renderDashboard);
}

// set the default values of select

renderDashboard();
changeSelect();

