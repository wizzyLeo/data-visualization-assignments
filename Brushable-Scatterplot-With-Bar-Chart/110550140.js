import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
console.log(d3.version);
function renderPlot(data){
    
    // create the SVG elements 
    const margin = {top: 20, right: 20, bottom: 20, left: 20},
        size = 150,
        mar = 20,
        width = 4*size + margin.left + margin.right,
        height = 4*size + margin.top + margin.bottom;

    const svg = d3.select("#plot-box")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
    

    
    
    const attributes = ["sepal length", "sepal width", "petal length", "petal width"];
    const scales = {};

    attributes.forEach(attr => {
        const maxVal = d3.max(data, d=>d[attr]);
        scales[attr] = d3.scaleLinear()
            .domain([0, maxVal])
            .range([size - margin.bottom, margin.top]);
    })

    const colorScale = d3.scaleOrdinal()
        .domain(['iris-setosa', 'iris-versicolor', 'iris-virginica'])
        .range(['#54b06d', '#a16ad9', '#d96aa3']);

    data.forEach(d => {
        d.selected = false;
        d.coord = [];
        attributes.forEach(xAttr => {
            attributes.forEach(yAttr => {
                if(xAttr !== yAttr){
                    const xOffset = attributes.indexOf(xAttr)*size;
                    const yOffset = attributes.indexOf(yAttr)*size;
                    d.coord.push({
                        x: scales[xAttr](d[xAttr]) + xOffset,
                        y: scales[yAttr](d[yAttr]) + yOffset
                    })
                }
            });
        });
    });

    // interactive function : brush
    const brush = d3.brush()
        .on('start brush', handleBrush);
    function handleBrush(event){
        if(!event.selection)    return;
        const [[x0, y0], [x1, y1]] = event.selection;
        svg.selectAll('circle').each(function(d){
            d.selected = d.coord.some(coord =>
                (coord.x >= x0 && coord.x <= x1 && coord.y >= y0 && coord.y <= y1)
            );
        })
        updateHighlight();
    }
    svg.call(brush);
    console.log(svg);
    
    // for every pair of attributes, create scatter plots
    attributes.forEach(yAttr => {
        attributes.forEach(xAttr => {
            if(xAttr !== yAttr){
                const xPos = attributes.indexOf(xAttr) * size;
                const yPos = attributes.indexOf(yAttr) * size;

                const xAxis = d3.axisBottom(scales[xAttr]).ticks(5);
                const yAxis = d3.axisLeft(scales[yAttr]).ticks(5);

                svg.append("g")
                    .attr("transform", `translate(${attributes.indexOf(xAttr)*size}, ${attributes.indexOf(yAttr)*size})`)
                    .selectAll("circle")
                    .data(data)
                    .enter().append("circle")
                    .attr("cx", d => scales[xAttr](d[xAttr]))
                    .attr("cy", d => scales[yAttr](d[yAttr]))
                    .attr('r', 2.5)
                    .style("fill", d => colorScale(d.class));
                svg.append("g")
                    .attr("transform", `translate(${xPos}, ${yPos + size - mar})`)
                    .call(xAxis);
                svg.append("g")
                    .attr("transform", `translate(${xPos + mar}, ${yPos})`)
                    .call(yAxis);
            }
        })
    })

    // interactive function : click
    
    function updateHighlight(){
        svg.selectAll('circle')
            .style('fill', d => d.selected ? "orange" : colorScale(d.class));
    }
    
    svg.selectAll('circle')
        .on('click', function(event, d){
            d.selected = !d.selected;
            updateHighlight();
        }) 
        .on('mousedown.brush', function(event){
            event.stopPropagation();
        });
    // show histograms along the diagonal
    attributes.forEach(attr => {
        const histogram = d3.histogram()
            .value(d => d[attr])
            .domain(scales[attr].domain())
            .thresholds(scales[attr].ticks(20))
            (data);
        const pos = attributes.indexOf(attr)*size;
        const scale = d3.scaleLinear()
            .domain([0, d3.max(histogram, d => d.length)])
            .range([0, size ]);
        const xAxis = d3.axisBottom(scales[attr]).ticks(5);
        const yAxis = d3.axisLeft(scales[attr]).ticks(5);
        svg.append("g")
            .attr("transform", `translate(${pos}, ${pos})`)
            .selectAll('rect')
            .data(histogram)
            .enter()
            .append('rect')
            .attr('x', d => scales[attr](d.x0) + 1)
            .attr('y', d => size - scale(d.length))
            .attr('width', d => scales[attr](d.x0) - scales[attr](d.x1) - 1)
            .attr('height', d => scale(d.length) - mar)
            .style('fill', 'steelblue');
        svg.append('g')
            .attr("transform", `translate(${pos}, ${pos + size - mar})`)
            .call(xAxis.ticks(0));
        
    })
    
}

d3.csv("http://vis.lab.djosix.com:2023/data/iris.csv")
    .then(data => {
        renderPlot(data);
    })
    .catch(error => {
        console.error("Error loading the data: ", error);
    });