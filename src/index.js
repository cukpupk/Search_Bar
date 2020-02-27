const DIRECTION = {
  UP: "up",
  DOWN: "down"
}; 
let _currentFocus = -1;
//MVC Pattern. 
function view(container, model) {
  //Creating HTML elements of two div
  //First div contains the input and button and display flex
  //Second div contains the searched options 
  let _icon = document.createElement("span")
  let _inside = document.createElement("div");
  let _input = document.createElement("input");
  let _options = document.createElement("div");
  let _button = document.createElement("button");
  _icon.setAttribute("class", "ex-search")
  _inside.setAttribute("class", "inside");
  _input.setAttribute("type", "text");
  _options.setAttribute("class", "options");
  _button.setAttribute("class", "_btn");
  _button.innerHTML = "X";
  container.appendChild(_inside);
  _inside.appendChild(_icon);
  _inside.appendChild(_input);
  _inside.appendChild(_button);
  container.appendChild(_options);
  _button.style.display = "none";
  //Call fetchData method in the model to get the data 
  let cb = debouce(model.fetchData, 100);
  _input.addEventListener("keyup", function(e) {
    let inputText = e.target.value;
    //if not press the enter key
    if (e.keyCode !== 13) cb(inputText);
    //if press the esc key, clean the input field and options
    if (e.keyCode === 27) {
      _input.value = "";
      _options.style.display = "none";
      return;
    }
  });
  _button.addEventListener("click", function(e) {
    //Click the button triggers cleaning the input field
    _input.value = "";
    //and make input field focus
    _input.focus();
    _options.style.display = "none";
  });
  _button.addEventListener("keyup", function(e) {
    //if press endter, cleans the input field
    if (e.keyCode === 13) {
      _input.value = "";
      _options.style.display = "none";
    }
    //if press tab key, make the options field focused
    if (e.keyCode === 9) {
      _options.focus();
    }
    //if press esc key, make the input field focused
    if (e.keyCode === 27) {
      _input.focus();
    }
  });
  container.addEventListener("keyup", function(e) {
    let keyCode = e.keyCode;
    //if press ip key
    if (keyCode === 38) {
      //focus of options goes UP
      model.arrowKey(DIRECTION.UP);
    } else if (keyCode === 40) {
      // DOWN
      model.arrowKey(DIRECTION.DOWN);
    }
  });//rendering Options
  function render(data, currentFocus) {
    console.log(_input.value.length)
    if(_input.value.length>=1) {
      _button.style.display="block";
    }
    if (_input.value === "") {
      //if input field is cleaned, clean options
      _options.style.display = "none";
      _button.style.display = "none";
    }
    if (!data || !data.length) {
      _options.style.display = "none";
    } else {
      _options.innerHTML = "";
      //loop through the data fetched
      for (let i = 0; i < data.length; i++) {
        let item = data[i];
        //bold elemts searched in the fetched data
        let array = item.split("");
        let inputvalue = _input.value.split(""); 
        for(let i=0;i<array.length;i++) {
          for(let j=0;j<inputvalue.length;j++) {
            if(array[i] === inputvalue[j]) {
              array[i] = '<b>'+array[i]+'</b>'
            }
          } 
        }
        let singleOption = document.createElement("div");
        singleOption.innerHTML = array.join("");

        if (i === currentFocus) {
          singleOption.setAttribute("class", "typeahead-active");
        }
        _options.addEventListener("click", function(e) {
          //if click inside the options field
          if (e.target.closest(".options")) {
          //click the elemnt will parse the option into the 
          //input field
            _input.value = e.target.innerText;
            _options.style.display = "none";
          }
        });
        _options.addEventListener("keyup", function(e) {
          //if press esc, focus the input
          if (e.keyCode === 27) {
            _options.style.display = "none";
            _input.focus();
          }
        });
        //append elemnts
        _options.appendChild(singleOption);
      }
      _options.style.display = "block";
      document.addEventListener("click", e => {
        //if click outside of the options field
        //clean options field but keep the input
        const ClickInside = _options;
        let targetElement = e.target;
        do {
          if (targetElement === ClickInside) {
            return;
          }
          targetElement = targetElement.parentNode;
        } while (targetElement);
        _options.style.display = "none";
      });
      document.addEventListener("keyup", e => {
        if (e.target === _options) {
          if(e.keyCode===27) {
            _input.focus();
          }
        }
      });
    }
  }
  //subscribe the render
  model.subscribe(render);
}
function model() {
  let _subscriber,
    _cache = {},
    _data;

  function _fetchData(text) {
    if (_cache[text]) {
      apiBack(_cache[text]);
    } else {
      fetch("https://swapi.co/api/people/?search=" + text)
        .then(response => response.json())
        .then(function(json) {
          _cache[text] = json;
          apiBack(json);
        });
    }
  }

  function apiBack(json) {
    let names = json.results.map(function(item) {
      return item.name;
    });
    _data = names;
    _subscriber(_data, _currentFocus);
  }

  function _arrowKey(direction) {
    // update _currentFocus

    if (direction === DIRECTION.DOWN) {
      _currentFocus++;

      _currentFocus = _currentFocus > _data.length - 1 ? 0 : _currentFocus;
    } else if (direction === DIRECTION.UP) {
      _currentFocus--;

      _currentFocus = _currentFocus < 0 ? _data.length - 1 : _currentFocus;
    }
    _subscriber(_data, _currentFocus);
  }

  return {
    //if subscriber changes, replace the new subscriber instead
    subscribe: function(fn) {
      if (!_subscriber) _subscriber = fn;
    },
    fetchData: _fetchData,
    arrowKey: _arrowKey
  };
}

function debouce(fn, wait) {
  let _timer;

  return function(...args) {
    clearTimeout(_timer);

    _timer = setTimeout(function() {
      fn.apply(null, args);
    }, wait);
  };
}

let typeAheadContainer = document.querySelector(".typeahead-container");
let typeAheadModel = model();

let typeAheadView = view(typeAheadContainer, typeAheadModel);
