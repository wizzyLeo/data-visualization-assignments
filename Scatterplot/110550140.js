document.querySelectorAll('.custom-select').forEach(setupSelector);

function setupSelector(selector) {
  selector.addEventListener('change', e => {
    console.log('changed', e.target.value)
  })

  selector.addEventListener('mousedown', e => {
    if(window.innerWidth >= 420) {// override look for non mobile
      e.preventDefault();

      const select = selector.children[1];
      const dropDown = document.createElement('ul');
      dropDown.className = "selector-options";

      [...select.children].forEach(option => {
        const dropDownOption = document.createElement('li');
        dropDownOption.textContent = option.textContent;

        dropDownOption.addEventListener('mousedown', (e) => {
          e.stopPropagation();
          select.value = option.value;
          selector.value = option.value;
          select.dispatchEvent(new Event('change'));
          selector.dispatchEvent(new Event('change'));
          dropDown.remove();
        });

        dropDown.appendChild(dropDownOption);   
      });

      selector.appendChild(dropDown);

      // handle click out
      document.addEventListener('click', (e) => {
        if(!selector.contains(e.target) && document.body.contains(dropDown)) {
          dropDown.remove();
        }
      });
    }
  });
}

// data visulization
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

let data;
d3.csv("http://vis.lab.djosix.com:2023/data/iris.csv").then(d => {
    data = d;
    console.log(data);
    // select all the attirbutes except 'class'
    const attributes = Object.keys(data[0]).filter(attr => attr !== "class");

    const xDropdown = document.getElementById('xAttribute');
    const yDropdown = document.getElementById('yAttribute');
    console.log(xDropdown);

    attributes.forEach(attr => {
        xDropdown.innerHTML += `<option value="${attr}">${attr.replace('_', ' ')}</option>`;
        yDropdown.innerHTML += `<option value="${attr}">${attr.replace('_', ' ')}</option>`;
    });
});

function updatePlot(){
    const svg = d3.select("svg");
    svg.selectAll("*").remove();
    // tweakable parameters for sizing
    const width = +svg.attr('width');
    const height = +svg.attr('height');
    const margin = {
        top: window.innerHeight * 0.08, 
        right: window.innerWidth * 0.02, 
        bottom: window.innerHeight * 0.08, 
        left: window.innerWidth * 0.1,
    };
    ;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const g = svg.append("g").attr('transform', `translate(${margin.left}, ${margin.top})`);

    // 2 attributes for visulization
    const xAttribute = document.getElementById('xAttribute').value;
    const yAttribute = document.getElementById('yAttribute').value;
    // define sclaer for X-axis and Y-axis
    const xScaler = d3.scaleLinear()
        .domain(d3.extent(data, d => +d[xAttribute]))
        .rangeRound([0, innerWidth]).nice();
    const yScaler = d3.scaleLinear()
        .domain(d3.extent(data, d => +d[yAttribute]))
        .rangeRound([innerHeight, 0]).nice();

    // add X-axis
    const xAxisGenerator = d3.axisBottom(xScaler)
        .tickSize(-innerHeight);
    const xAxis = g.append("g")
        .attr('transform', `translate(0, ${innerHeight})`)
        .call(xAxisGenerator);
    xAxis.select('.domain')
        .attr('stroke', 'white');
    xAxis.append("text")
        .attr('fill', "black")
        .attr('x', innerWidth / 2)
        .attr('dy', '2.5em')
        .attr('text-anchor', 'middle')
        .text(xAttribute.replace('_', ' '));
    
    // add Y-axis
    const yAxisGenerator = d3.axisLeft(yScaler).tickSize(-innerWidth);
    const yAxis = g.append('g').call(yAxisGenerator);
    yAxis.append('text')
        .attr('fill', 'black')
        .attr('transform', 'rotate(-90)')
        .attr('y', innerHeight / 2)
        .attr('y', -40)
        .attr('dy', '0.71em')
        .attr('text-anchor', 'end')
        .text(yAttribute.replace('_', ' '));
    // add data dots to scatterplot
    g.selectAll('circle')
        .data(data)
        .enter().append('circle')
        .attr('cx', d => xScaler(+d[xAttribute]))
        .attr('cy', d => yScaler(+d[yAttribute]))
        .attr('r', 4)
        .attr('fill', d => {
            switch(d.class){
                case "Iris-setosa": return "rgb(146, 171, 212, 0.8)";
                case "Iris-versicolor": return "rgb(211, 146, 212, 0.8)";
                case "Iris-virginica": return "rgb(101, 194, 153)";
            }
        });
    

}

const btn = document.querySelector('button');
btn.addEventListener('click', updatePlot);

function resizeSVG(){
    const svg = d3.select('svg');
    const width = window.innerWidth * 0.8;
    const height = window.innerHeight * 0.6;
    svg.attr('width', width);
    svg.attr('height', height);
    svg.attr('viewBox', `0 0 ${width} ${height}`);
}


resizeSVG();

window.addEventListener('resize', resizeSVG);