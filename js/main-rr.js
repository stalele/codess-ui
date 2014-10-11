/*---Variables------*/
    // define api keys
    var apiKey = 'ef52d33ae515465c74fe383a71089f43';
    var apiSecret = '2ac7e97f4fff53f76ecd2f5f376e71a3';

    var hovercity;

    // create a Cache object
    var cache = new LastFMCache();

    // create a LastFM object
    var lastfm = new LastFM({
        apiKey    : apiKey,
        apiSecret : apiSecret,
        cache     : cache
    });

    //Global vars
    var TOPTRACKS = [];
    var TOPCHARTS =[];
    var METROS={};
    var MAPDATA=[];

    //use these for displaying legend
    var ALLTOPTRACKS = [];
    var obj={};
    var objtoptracks={};
    var toptrackslegend=[];
    var colors=["#E03A37","#eb7f30","#BF2EBD","#2cb2f1","#6B3F95","#f6e742","#E75CB1","#498ebc","#0600BD","#6C3337","#9CD8E0","#FF8FC7","#edaa5c","#c4adeb"];
    var latlngFile = 'json/metros_latlng.json';
    var citymap = {};

    //map vars
    var cityCircle;
    var geocoder;
    var map;
    var contentString = '<div id>'+ 
      '<iframe src="toptracks_bars.html" width="700px" height="500px"></iframe>'+
      ' <span id="modalClose">X</span>'+
      '</div>';
    var infowindow = new google.maps.InfoWindow({
      content: contentString,
      floatShadow: 1
    });    
    var marker,data;

    //deferred object: Indicates that all TOPTRACKS are processed
    var getDataDone = $.Deferred();
    //deferred object: Indicates that all Metros are processed
    var getMetroDataDone = $.Deferred();

/*---Page Load------*/
$(window).load(function () {
    $('#ytapiplayer').show();
    console.log("doc load");
  
    //start: added by dheera

    //display map by gettin all metros for last.fm from metros.json file which is a cached JSON file with information about metros that last.fm operates in  
      $.getJSON(latlngFile, function (datainner) {
       // console.log("Inside latlng json read");
        $.each(datainner.metros.metro,function(key,valueinner){
          citymap[valueinner.name]={center:new google.maps.LatLng(valueinner.Latitude, valueinner.Longitude),population:100,Country: valueinner.Country};
        });
        console.log("citymap length"+JSON.stringify(citymap));
        initialize();
      }).fail(function() {
        console.log("FIRST fail");
      });
    //end: added by dheera
 console.log(citymap);
    getMetroData();

    //Deferred call to getData and getChartData
    $.when(getMetroDataDone).then(function(){
        console.log("Got Metro Data ");
        //getData();
        getChartData()
    })

    $.when(getDataDone).then(function(){
        console.log("Tracks processing complete ");
        console.log("Integration Point - RenderData Fn here");
        //TODO - Invoke renderData here
    })
    
    $("#legend #legendlist").on("click", ".legendItem",function(){
      $(".playTrack").animate({
          opacity:0,
          zIndex:110,
      },0);
      $(".playTrack").css({
          display:'none',
      });
      $(".legendItem a").css({
          color:"#333",
      });
      $(this).find(".playTrack").animate({
          opacity:1,
          zIndex:120,
      },0);
      $(this).find(".playTrack").css({
          display:'block',
          backgroundImage: 'http://people.ischool.berkeley.edu/~ajeeta/iolab4/js/playingwhite.png',
      });
      $(this).find("a").css({
          color:"rgba(235, 86, 53, 1.0)",
      });
      $('#videoPlayer').animate({
          opacity:1
      },300);
      $('#videoPlayer').css({
          display:'block'
      });
      console.log("in li click");
      var text = $(this).find("p").text();
      loadPlayer(text,text);
    });

    $("#legend #legendlist").on("mouseover", ".legendItem",function(){
      if($(this).find(".playTrack").css("zIndex")!=120){
        $(this).find("a").css({
            color:"rgba(235, 86, 53, 1.0)",
        });
        $(this).find(".playTrack").animate({
            opacity:1,
            zIndex:110,
        },0);

        $(this).find(".playTrack").css({
            display:'block',
        });
      }
    });

    $("#legend #legendlist").on("mouseout", ".legendItem",function(){
      if($(this).find(".playTrack").css("zIndex")!=120){
        $(this).find("a").css({
            color:"#333",
        });
        $(this).find(".playTrack").animate({
            opacity:0,
            zIndex:110,
        },0);
        $(this).find(".playTrack").css({
            display:'none',
        });
      }
    });


    $('#modalClose').click( function() {
               $(".chart").empty();
               $('#modal').animate({
              opacity:0
            },300);
            $('#modal').css({
              display:'none'
            });
          });
    var viewportWidth = $(window).width();
    var viewportHeight = $(window).height();
    var infoHeight = $('#info').height();
    var infoWidth = $('#info').width();

    $('#mapWrapper').css({
        width: viewportWidth,
        height: viewportHeight,
    });

     $('.chart').css({
        height: viewportHeight,
    });

    $('#infoWrapper').css({
        width: viewportWidth,
        height: viewportHeight,
    });

    $('#legendHeaderMin').hide();

    $('#legendHeaderMin').click(
        function(){
            $(this).css({
                display:'none',
            });
            $('#legend').toggle(100);
        }
    );

    $('#legendHeaderMax').click(
        function(){
            $('#legendHeaderMin').css({
                display:'block',
            });
            $('#legend').toggle(100);
        }
    );

    $('#info').css({
        left:(viewportWidth-infoWidth)/2,
    });

    $('#info').delay(2200).animate({
        top:120,
        opacity:1,
    },300);

    $('#infoClose, #exploreButton').click(
        function(){
            $('#info').animate({
                top:-350,
                opacity:0,
            },300);
            $('#infoWrapper').delay(400).animate({
                opacity:0,
                zIndex:10,
            },300);
            $('#infoWrapper').css({
                display:'none',
            });
        }
    );

});

function initialize() {

  // Create the map.
  geocoder = new google.maps.Geocoder();
  var latlng = new google.maps.LatLng(37.7002, -122.406);
  var mapOptions = {
    zoom: 2,
    minZoom: 2,
    center: latlng,
    mapTypeControl: false,
  };
  var map = new google.maps.Map(document.getElementById('map-canvas'),
  mapOptions);

  //get top track for each metro: {cityname:track}
  
  getData();

  $.when(getDataDone).then(function(){
          console.log("Tracks processing complete ALLTOPTRACKS.length="+ALLTOPTRACKS.length);
          console.log("Integration Point - RenderData Fn here");
          //TODO - Invoke renderData here
            for(var i=0;i<ALLTOPTRACKS.length;i++)
            {
                toptrackslegend[i]=ALLTOPTRACKS[i]["toptrack"];
            }
          //sort the legend array
          toptrackslegend=toptrackslegend.sort();
          console.log("toptrackslegend = "+toptrackslegend);
      
          //code for getting unique tracks for displaying the legend
            
              var hash = {}, result = [];
              for ( var i = 0, l = toptrackslegend.length; i < l; ++i ) {
          
                if ( !hash.hasOwnProperty(toptrackslegend[i]) ) { //it works with objects! in FF, at least
              
                  hash[ toptrackslegend[i] ] = true;
                  result.push(toptrackslegend[i]);
                }
              }

          //

          //pick random colors from array to display as legend
          var randcolor = result[Math.floor(Math.random() * result.length)];
          for(var index=0;index<result.length;index++)
          {
            //$("#legendlist").append('<li class="legendItem"><span class="trackLegendColor" style="background:'+colors[index]+';"></span><p class="trackLegendName">'+result[index]+'</p></li>');
            $("#legendlist").append('<li class="legendItem"><span class="trackLegendColor" style="background:'+colors[index]+';"></span><span class="playTrack"></span><p class="trackLegendName"><a href=#>'+result[index]+'</a></p></li>');
          }

      // Construct the circle for each value in citymap.
      // Note: We scale the population by a factor of 20.
        var metrocolor,trackindex;
          for (var city in citymap) {
            

            for (var iterate=0;iterate<ALLTOPTRACKS.length;iterate++)
            {
                if(ALLTOPTRACKS[iterate]["city"]==city)
                {
                  trackindex=result.indexOf(ALLTOPTRACKS[iterate]["toptrack"]);
                  metrocolor=colors[trackindex];
                  console.log("COLOR for metro "+city+" is"+metrocolor+" Top track is "+ALLTOPTRACKS[iterate]["toptrack"]);
                }
               
            }

             var newCityCircle = {
              path: 'M 100 100 L 300 100 L 200 300 z',
              fillColor: metrocolor,
              fillOpacity: 0.8,
              strokeColor: metrocolor,
              strokeWeight:16,
              strokeOpacity:0.8,
              scale:0.0001
          }

          var populationOptions = {
            icon: newCityCircle,
            map: map,
            title: city,
            position: new google.maps.LatLng(citymap[city]['center']['k'],citymap[city]['center']['A'] ),
          };
          console.log(" city k = "+citymap[city]['center']['k']+" city A ="+citymap[city]['center']['A'])
          console.log(populationOptions);

          marker = new google.maps.Marker(populationOptions); 

//hover event: start
          
          var infowindow = new google.maps.InfoWindow({});
          
          google.maps.event.addListener(marker, "mouseover", function() {
            
            
              console.log("hovered city="+this.getPosition().lat());
              var hovercity, hovercontent,toptracknametemp,toptrackartisttemp,toptrackurltemp,trackindextemp,metrocolortemp,toptrackartistimgtemp;
              for (var city in citymap) {
                if(citymap[city]['center']['k']==this.getPosition().lat()&&citymap[city]['center']['A']==this.getPosition().lng()){
                    hovercity=city;
                    console.log(hovercity);
      
                    //get the track for the hovered city
                    for (var iterate=0;iterate<ALLTOPTRACKS.length;iterate++)
                    {
                        if(ALLTOPTRACKS[iterate]["city"]==city)
                        {
                          toptracknametemp=ALLTOPTRACKS[iterate]["toptrack"];
                          toptrackartisttemp=ALLTOPTRACKS[iterate]["toptrackartist"];
                          toptrackurltemp=ALLTOPTRACKS[iterate]["toptrackurl"];
                          toptrackartistimgtemp=ALLTOPTRACKS[iterate]["toptrackartistimg"];
                          data=ALLTOPTRACKS[iterate]["toptentracks"];//data for viz
                          
                        }
                       
                    }

                     hovercontent = '<div id="trackHoverMetro"><p>Metro: '+city+'</p></div><a onclick=playVideo()><div id="topTrackInfo"><img id="trackHoverImg" src='+toptrackartistimgtemp+'></img><span class="playVideo"></span><div><p id="hoverTrack" class="trackHoverMeta">Top Track: '+toptracknametemp+' </p><p class="trackHoverMeta">Artist: '+toptrackartisttemp+'</p></div></div></a><div id="trackHoverChart"><p><a onclick=onClickInfoWindow()>Top Ten Tracks for '+city+'</a></p></div>';
                }
              }
              
              infowindow.setPosition(this.getPosition());
              infowindow.setContent(hovercontent);
              marker.setPosition(this.getPosition());
    
   

              infowindow.open(map,marker);
              
          }); 
          //clear the contents of the infwindow on closeclick
          google.maps.event.addListener(infowindow, 'closeclick', function() {
                infowindow.setContent('');
          });
//hover event: end

          // On click

        google.maps.event.addListener(marker, 'click', function(event) {
          //getmodal(marker);
            // MAPDATA.push(marker.title);
            // window.alert(marker.title);
            // infowindow.setContent(marker.title)
            infowindow.open(map, marker);
          });

         // google.maps.event.trigger(marker, "click");

          }

      });

}

function onClickInfoWindow(){
    $("#trackHoverChart").on("click",function(){
        console.log("inside infowindow click event");

        $('#modal').animate({
            opacity:1
        },300);
        $('#modal').css({
            display:'block',
        });
        renderModalData();
        $(".chart").empty();


             //dheera: start viz

                    // Set color values. Currently using 10 colors and assign based on Artist Name
                    var color = d3.scale.category10();


                    // Create list of unique artists to determine color value
                    var artist = []
                    for (i=0;i<data.length;i++) {
                      artist.push(data[i].artist.name) 
                      //console.log(data[i].artist.name);
                    }
                    
                    var uniqueArtist = artist.filter(function(elem, pos) {
                        return artist.indexOf(elem) == pos;
                    })

                    // SVG variables
                    var width = $(window).width()-200,
                        barHeight = 50,
                        max_poularity = d3.max(data, function(d) { return d.listeners;});

                    var x = d3.scale.linear()
                        .domain([0, max_poularity])
                        .range([0, width-100]);

                    var chart = d3.select(".chart")
                        .attr("width", width);
                        

                    var header = chart.select("g")
      
                    // Bind data to the bars
                    var bar = chart.selectAll("g")
                        .data(data)
                        .enter().append("g")
                        .attr("transform", function(d, i) { return "translate(100," + i * barHeight + ")"; })
                        .attr("class","bar");

                    // Draw bars. Fill color based on artist name. Bars transition starting from 0
                    bar.append("rect")
                        .attr("fill", function(d) {return color(uniqueArtist.indexOf(d.artist.name));})
                        .attr("opacity", 0.8)
                        .attr("width", 0)
                        .attr("x", "-60")
                        .transition()
                        .duration(1200)
                        .attr("width", function(d) { return x(Number(d.listeners/2.2));})
                        .attr("height", barHeight - 1);

                    // Add album cover image
                    bar.append("rect")
                           .attr("width","50")
                           .attr("height","49")
                           .attr("x", "-110")
                           .attr("class","album-art");

                    // Add chart position number
                    bar.append("text")
                        .text(function(d,i) { return i+1; })
                        .attr("x", "-71")
                        .attr("y", "23")
                        .attr("opacity", "1")
                        .attr("class", "count");

                    bar.append("image")
                        .attr("xlink:href", "http://people.ischool.berkeley.edu/~ajeeta/iolab4/js/playing.png")
                        .attr("width","50")
                        .attr("height","49")
                        .attr("x", "-111")
                        .attr("opacity", "0")
                        .attr("class", "playing");

                    bar.append("image")
                        .attr("xlink:href", "http://people.ischool.berkeley.edu/~ajeeta/iolab4/js/play.png")
                        .attr("width","50")
                        .attr("height","49")
                        .attr("x", "-111")
                        .attr("opacity", "0")
                        .attr("class", "play");

                    bar.append("text")
                        .text("Play Track")
                        .attr("x", function(d) { return x(Number(d.listeners/1.6)-24);})
                        .attr("y", "22")
                        .attr("opacity", "0")
                        .attr("class", "playSong");
                         
                   // Add track title and link to play song?
                    bar.append("svg:a")
                        .append("text")
                        .text(function(d) { return d.name; })
                        .attr("class", "track")
                        .attr("x", "-50")
                        .attr("y", "20");

                    // Add artist name and link to last fm page?
                    bar.append("svg:a")
                        .append("text")
                        .text(function(d) { return d.artist.name; })
                        .attr("class", "artist")
                        .attr("x", "-50")
                        .attr("y", "38");

                    d3.selectAll(".bar").on("click", function (d) {
                      $('div#videoPlayer').animate({opacity:1},300);
                      $('div#videoPlayer').css({display:'block'});
                      $(".play").animate({opacity:0},0);
                      $(".playing").animate({opacity:0},0);
                      $(".count").animate({opacity:1},0);
                      $(".playTrack").animate({
                          opacity:0,
                          zIndex:110,
                      },0);
                      $(".playTrack").css({
                          display:'none',
                      });
                      $(".legendItem a").css({
                          color:"#333",
                      });
                      $(this).find(".playing").animate({opacity:1},0);
                      $(this).find(".play").animate({opacity:0},0);
                      $(this).find(".playing").animate({opacity:1},0);
                      $(".bar").animate({opacity:1},200);
                      var currentTrack = $(this).find(".track").text();
                      //console.log(currentTrack);
                      loadPlayer(currentTrack,currentTrack);
                    });
                    
                    d3.selectAll(".bar").on("mouseover", function (d) {
                      $(this).animate({opacity:0.85},0);
                      $(this).find(".play").animate({opacity:1},0);
                      $(this).find(".count").animate({opacity:0},0);
                    });

                    d3.selectAll(".bar").on("mouseout", function (d) {
                      $(this).animate({opacity:1},0);
                      $(this).find(".play").animate({opacity:0},0);
                      $(this).find(".count").animate({opacity:1},0);
                    });

                    chart.append("text")
                        .attr("x", -10)             
                        .attr("y", -45)
                        .attr("class", "chartTitle") 
                        .text("Top Ten Tracks for Metro");

                    chart.append("text")
                        .attr("x", -10)             
                        .attr("y", -20)
                        .attr("class", "chartLegend") 
                        .text("* Each artist is represented by a unique color");


                    //dheera: end viz
    });
}

function playVideo(){
$("#topTrackInfo").on("click",function(){
      $('#videoPlayer').animate({
          opacity:1
      },300);
      $('#videoPlayer').css({
          display:'block'
      });
      $(".playTrack").animate({
          opacity:0,
          zIndex:110,
      },0);
      $(".playTrack").css({
          display:'none',
      });
      $(".legendItem a").css({
          color:"#333",
      });
      $(this).find(".trackHoverMeta").css({
          color:'#eb5635',
      });
      console.log("in li click");
      var text = $(this).find("#hoverTrack").text().slice(11);
      console.log(text);
      loadPlayer(text,text);
    });
}


function getmodal(marker) {
  window.alert(marker.title)

}

function codeLatLng(latlng) {
    console.log("codelatlng");
    console.log("latlng in code fn");
    console.log(latlng);
    var input = latlng;
    var lat = parseFloat(latlng.nb);
    var lng = parseFloat(latlng.ob);
    var latlng = new google.maps.LatLng(lat, lng);
    geocoder.geocode({'latLng': latlng}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        if (results[1]) {
          console.log("in results");
          map.setZoom(5);
          marker = new google.maps.Marker({
              position: latlng,
              map: map
          });
          MAPDATA.push(results[1].formatted_address.split(',')[0]);
          renderModalData();
          infowindow.setContent(results[1].formatted_address);
          infowindow.open(map, marker);
        }
      } else {
        alert("Geocoder failed due to: " + status);
      }
    });
  }

//binds the data to modal
function renderModalData(){
  $.each(TOPTRACKS, function(i, val) {
       console.log(val);
    });


}
/*----getMetroData-----*/
function getMetroData(){
      $.ajax({
        success:handleMetroDatavar
 })

}
var handleMetroDatavar=function getMetros(){
    lastfm.geo.getMetros
    ({
        api_key:apiKey
    },
    {
        success: function(data) {
            //console.log("getmetros");
            $.extend(METROS, data );
            //console.log(METROS);
            getMetroDataDone.resolve(); 
            
        },
        error: function(data) {
            console.log("getMetros: " + data.error + " " + data.message);
        }
    });

}

/*Assembles the Data for top tracks */
function getData(){
  console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
    for (var city in citymap) {
      console.log("getting top track for the country "+citymap[city].Country+" corresponding to the metro "+ city);
        
        getTopTracks(citymap[city].Country, city);
    }
    console.log("HELLO ALLTOPTRACKS.length=" +ALLTOPTRACKS.length);
}

function getTopTracks(country,city){
//dheera start
var url="http://ws.audioscrobbler.com/2.0/?method=geo.getTopTracks&api_key="+apiKey+"&country="+country+"&city="+city+"&format=json";
console.log(" URL is "+ url);
var dataTopTenTracks;
$.getJSON(url,function(data) {
  var index=0;
    $.each(data, function(key, value) {
     

        if(index==237)
        {
          console.log("reached 237");
        }
      else{
            //var jsonData = JSON.parse(JSON.stringify(data.toptracks.track));
            console.log("city="+city+ " country="+country+" top track="+data.toptracks.track[0]["name"]);
            
            objtoptracks["city"]=city;
            objtoptracks["data"]=data;
            //TOPTRACKS[index].toptracks['@attr']['metro'] =city;
           TOPTRACKS.push(objtoptracks);

           dataTopTenTracks = data.toptracks.track.slice(0,10)
          

            obj["city"]=city;
            obj["country"]=country;
            obj["toptrack"]=data.toptracks.track[0]["name"];
            obj["toptrackurl"]=data.toptracks.track[0]["url"];
            obj["toptentracks"]=dataTopTenTracks;

            obj["toptrackartist"]=data.toptracks.track[0]["artist"]["name"];
            
             var x=data.toptracks.track[0]["image"];

             if (typeof x != "undefined") {
               
               obj["toptrackartistimg"]=x[0]["#text"];
            }
            else{
              console.log("no image for city"+city);
              obj["toptrackartistimg"]="";
            }
            

            
            ALLTOPTRACKS.push(obj);

            obj = {};
            objtoptracks = {};
          }

    });
    if(ALLTOPTRACKS.length==237&&TOPTRACKS.length==237){
        console.log("array length "+ALLTOPTRACKS.length);
       getDataDone.resolve(); 

      }


  });
//dheera end

}
/* End of code for getting top tracks for each metro */


/*Assembles the Data for top charts */
function getChartData(){
    console.log("inside metro track chart function");
    $.ajax({
        success:handleMetroTrackChartVar
 })
}

var handleMetroTrackChartVar=function handleMetroTrackChartData() {
    var metro=METROS.metros.metro;
    $.each(metro, function(i, object) {
    getMetroTrackCharts(object.country,object.name);
    });
}


function getMetroTrackCharts(country, city){
    lastfm.geo.getMetroTrackChart
    ({
        
        metro:city,
        country:country,
        api_key:apiKey
    },
    {
        success: function(data) {
            TOPCHARTS.push(data);
            //console.log("top charts"); 
            //console.log(TOPCHARTS);
            
        },
        error: function(data) {
            console.log("getTopCharts: " + data.error + " " + data.message);
        }
    });
}


function loadPlayer(artist, track) {
    var options = {
      orderby: "relevance",
      q: artist + " " + track,
      "start-index": 1,
      "max-results": 1,
      v: 2,
      alt: "json"
    };


    $.ajax({
      url: 'http://gdata.youtube.com/feeds/api/videos',
      method: 'get',
      data: options,
      dataType: 'json',
      success: function(data) {

        var player = document.getElementById('myytplayer');
        var id = data.feed.entry[0].id["$t"];
        var mId = id.split(':')[3];
        // console.log(mId)

        if (!player) {
            var params = { allowScriptAccess: "always" };
            var atts = { id: "myytplayer" };
            swfobject.embedSWF("http://www.youtube.com/v/" + mId + "?enablejsapi=1&playerapiid=ytplayer&version=3&autoplay=1&autohide=0",
                           "ytapiplayer", "300", "200", "8", null, null, params, atts);
        } else {
         
          player.loadVideoById(mId, 0, "large");
        }


    
        $('#ytapiplayer').show();


      },
      error : function() {
        console.log("error");
      }
      });
}