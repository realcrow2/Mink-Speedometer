// Default values for mink_carhud
// Save a copy of this file before editing if you are unsure.
let settings = {
  gauges:{
    elements:{    // Identifiers of elements
      fuel:"#fuel",
      fuel_bg:"#fuelFill",
      speed:"#speed",
      speed_bg:"#speedFill",
      rpm:"#rpm",
      rpm_bg:"#rpmFill"
    },
    units:"MPH", // Default units
    display:{ // Default display values for gauges
      fuel:true,
      speed:true,
      rpm:true,
    },
    color:{ // Default colors of bars
      speed:["#f0a202", "#f48c06", "#e85d04", "#dc2f02", "#d00000", "#9d0208"],
      rpm:["#e8e8e8", "#cfcfcf", "#ff8a7a", "#e5383b", "#9b0d12"],
      fuel:["#f0a202", "#f0a202"]
    }
  },
  dashboard:{
    elements:{ // Identifiers of dashboard elements
      main:"#infoCluster",
      left:"#leftIndicatorDisplay",
      right:"#rightIndicatorDisplay",
      seatbelt:"#seatbeltDisplay",
      engine:"#engineDisplay",
      fuel:"#fuelDisplay",
      cruisecontrol:"#ccDisplay",
      lowbeam:"#lowBeamDisplay",
      highbeam:"#highBeamDisplay"
    },
    engineAlert:10, // Default engine alert
    fuelAlert:20, // Default fuel alert
    display:true, // Display of gauges
    individual:{
      left:true,
      engine:true,
      seatbelt:true,
      fuel:true,
      cruisecontrol:true,
      lowbeam:true,
      highbeam:true,
      right:true
    }
  },
  streetCompass:{ 
    elements:{
      street:"#streetName",
      compass:"#compass",
      heading:"#compass-current-number",
      caret:"#compass-current-caret"
    },
    display:{ // Display of street
      street:false,
      compass:false,
      heading:false,
      caret:false
    }
  },
  size:{
    fuel:{
      base:90,
      scale:1,
    },
    speed:{
      base:168,
      scale:1,
      font:[38, 14]
    },
    rpm:{
      base:112,
      scale:1,
      font:[18, 11]
    },
    dashboard:{
      base:42,
      scale:1,
      padding:9
    },
    street:"18px",
    compass:{
      scale:1
    },
  },
  position:{ // Default positions of elements
    fuel:{
      top:"0px",
      left:"0px"
    },
    speed:{
      top:"0px",
      left:"0px"
    },
    rpm:{
      top:"0px",
      left:"0px"
    },
    dashboard:{
      top:"0px",
      left:"0px"
    },
    street:{
      top:"0px",
      left:"0px"
    },
    compass:{
      top:"0px",
      left:"0px"
    }
  },
  refresh:100, // Default refresh rate, make sure you also change it in html (IN MILLISECONDS)
  compass: {
    display:true,
    movement_scale: 2.66666666667, // 2.66666666667px = 1 heading [DO NOT CHANGE IF YOU DON'T KNOW WHAT YOU ARE DOING, IT WILL BREAK THE ACCURACY OF COMPASS]
    background_position:1225, // N center
  }
};
let default_settings = JSON.parse(JSON.stringify(settings));