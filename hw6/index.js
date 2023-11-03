import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
// const file_path = "http://vis.lab.djosix.com:2023/data/ma_lga_12345.csv";
const file_path = "ma_lga_12345.csv";
const test_file_path = "https://raw.githubusercontent.com/holtzy/data_to_viz/master/Example_dataset/5_OneCatSevNumOrdered_wide.csv";
let houses, units, data;

function typeConversion(d){
    return {
        saledate: d3.timeParse("%d/%m/%Y")(d.saledate),
        MA: +d.MA,
        type: d.type,
        bedrooms: +d.bedrooms
    }
}
d3.csv(file_path, typeConversion)
    .then((parsedData)=>{
        console.log("Successfully loaded data");
        data = parsedData;
        const stackedBedrooms = transformData(data, "bedrooms");
        const stackedType = transformData(data, "type");
        console.log(stackedBedrooms);
        console.log(stackedType);
        
    }).catch((error)=>{
        console.log("error loading data")
        console.log(error);
    });

function transformData(data, layerAttribute) {
    // Group the data by the layer attribute
    const groupedData = d3.rollup(data, v => v, d => d[layerAttribute]);
    
    // Create a structure suitable for stacking
    const series = Array.from(groupedData, ([key, values]) => ({
        key: key,
        values: values.map(d => ({ date: d.saledate, value: d.MA })) // or other attributes as necessary
    }));
    
    // Stack the data by the date on the x-axis and value on the y-axis
    const stack = d3.stack()
        .keys(series.map(d => d.key))
        .value((d, key) => {
        const entry = d.values.find(v => v.date === key);
        return entry ? entry.value : 0;
        })
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetWiggle); // Or another offset method
    
    // We map the series to the required structure for stack layout
    const stackedData = stack(series.map(d => d.values.reduce((acc, v) => {
        acc[v.date] = v.value;
        return acc;
    }, {})));
    
    return stackedData;
    }
    



function renderStreamGraph(data, keys){
    // set the dimension and margin of the graph
    const boxWidth = parseInt(d3.select("#stream-graph-container").style("width"), 10);
    const boxHeight = parseInt(d3.select("#stream-graph-container").style("height"), 10);
    const margin = {top: 10, right: 30, bottom: 30, left: 60},
        width = boxWidth - margin.left - margin.right,
        height = boxHeight - margin.top - margin.bottom;
    // append the svg object to the body of the page
    const svg = d3.select("#stream-graph-container")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform",
                `translate(${margin.left}, ${margin.top})`);
    // list of groups = header of the csv files
    // const keys = data.columns.slice(1);

    // Add X axis
    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.year))
        .range([0, width]);
    svg.append("g")
        .attr("transform", `translate(0, ${height*0.8})`)
        .call(d3.axisBottom(x).tickSize(-height*0.7).tickValues([1900, 1925, 1975, 2000]))
        .select(".domain").remove();
    svg.selectAll(".tick line").attr("stroke", "#b8b8b8");
    svg.append("text")
        .attr('text-anchor', 'end')
        .attr('x', width)
        .attr('y', height - 30)
        .text('Year');
    
    // add Y axis
    const y = d3.scaleLinear()
        .domain([-100000, 100000])
        .range([height, 0]);
    
    const color = d3.scaleOrdinal()
        .domain(keys)
        .range(d3.schemeDark2);
    
    // stack the data
    const stackedData = stackData(data, );
    console.log(stackedData);
    // create a tooltip
    const Tooltip = svg
        .append('text') 
        .attr('x', 0)
        .attr('y', 0)
        .style("opacity", 0)
        .style("font-size", 17);
    
    const mouseover = function(event, d) {
        Tooltip.style("opacity", 1)
        d3.selectAll('.myArea').style("opacity", .2);
        d3.select(this)
            .style('stroke', 'black')
            .style("opacity", 1);
    }
    const mouseleave = function(event, d) {
        Tooltip.style("opacity", 0)
        d3.selectAll(".myArea").style("opacity", 1).style("stroke", "none")
    }
    const mousemove = function(event, d, i){
        grp = d.key;
        Tooltip.text(grp);
    }

    // add the area
    svg.selectAll("myLayers")
        .data(stackedData)
        .enter().append("path")
        .attr('class', 'myArea')
        .style("fill", d=>color(d.key)).style("stroke", "white")
        .attr("d", d3.area()
            .x(d => x(d.data.year))
            .y0(d => y(d[0]))
            .y1(d => y(d[1]))
        )
        .on("mouseover", mouseover)
        .on("mouseleave", mouseleave)
        .on()

}

