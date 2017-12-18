var search, results, selectedSeries = [],
    allSeries = [], filteredSeries = [];
var format, header, collapse, collapseAggregation, representationMode = "";
var startDate, endDate, selectedTheme, selectedSource, selectedFrequency = "";
var frequencyTranslation = {
    "R/P1Y": "Anual",
    // "R/P6M": "Semestral",
    "R/P3M": "Trimestral",
    "R/P1M": "Mensual",
    "R/P1W": "Semanal",
    "R/P1D": "Diaria"
}

function updateApiUrl() {
    // genero URL base con los ids solicitados
    apiUrl = "http://apis.datos.gob.ar/series/api/series?ids=" + selectedSeries.join(",")

    // formato
    if (format) {
        apiUrl = apiUrl + "&format=" + format
    }

    // encabezados
    if (header) {
        apiUrl = apiUrl + "&header=" + header
    }

    // frecuencia temporal
    if (collapse) {
        apiUrl = apiUrl + "&collapse=" + collapse
    }

    // función de agregación temporal
    if (collapseAggregation) {
        apiUrl = apiUrl + "&collapse_aggregation=" + collapseAggregation
    }

    // transformación / modo de representación
    if (representationMode) {
        apiUrl = apiUrl + "&representation_mode=" + representationMode
    }

    // fecha de comienzo
    if (startDate) {
        apiUrl = apiUrl + "&start_date=" + startDate
    }

    // fecha de fin
    if (endDate) {
        apiUrl = apiUrl + "&end_date=" + endDate
    }

    console.log(apiUrl)
    $("#apiUrl").text(apiUrl)
    $("#apiUrl").attr("href", apiUrl)
}

var indexStrategySelect = document.getElementById('indexStrategySelect');
var removeStopWordsCheckbox = document.getElementById('removeStopWordsCheckbox');
var indexOnserie_descripcionCheckbox = document.getElementById('indexOnserie_descripcionCheckbox');
var useStemmingCheckbox = document.getElementById('useStemmingCheckbox');
var sanitizerSelect = document.getElementById('sanitizerSelect');
var tfIdfRankingCheckbox = document.getElementById('tfIdfRankingCheckbox');

var rebuildAndRerunSearch = function() {
    rebuildSearchIndex();
    searchSeries();
};

indexStrategySelect.onchange = rebuildAndRerunSearch;
removeStopWordsCheckbox.onchange = rebuildAndRerunSearch;
indexOnserie_descripcionCheckbox.onchange = rebuildAndRerunSearch;
useStemmingCheckbox.onchange = rebuildAndRerunSearch;
sanitizerSelect.onchange = rebuildAndRerunSearch;
tfIdfRankingCheckbox.onchange = rebuildAndRerunSearch;

var rebuildSearchIndex = function() {
    search = new JsSearch.Search('serie_id');

    if (useStemmingCheckbox.checked) {
        search.tokenizer = new JsSearch.StemmingTokenizer(stemmer, search.tokenizer);
    }
    if (removeStopWordsCheckbox.checked) {
        search.tokenizer = new JsSearch.StopWordsTokenizer(search.tokenizer);
    }

    search.indexStrategy = eval('new ' + indexStrategySelect.value + '()');
    search.sanitizer = eval('new ' + sanitizerSelect.value + '()');;

    if (tfIdfRankingCheckbox.checked) {
        search.searchIndex = new JsSearch.TfIdfSearchIndex('serie_id');
    } else {
        search.searchIndex = new JsSearch.UnorderedSearchIndex();
    }

    if (indexOnserie_descripcionCheckbox.checked) {
        search.addIndex('serie_descripcion');
    }

    search.addDocuments(filteredSeries);
};

var indexedSeriesTable = document.getElementById('indexedSeriesTable');
var indexedSeriesTBody = indexedSeriesTable.tBodies[0];
var searchInput = document.getElementById('searchInput');
var serieCountBadge = document.getElementById('serieCountBadge');

var updateSeriesTable = function(series) {
    indexedSeriesTBody.innerHTML = '';

    var tokens = search.tokenizer.tokenize(searchInput.value);

    for (var i = 0, length = series.length; i < length; i++) {
        var serie = series[i];

        var checkbox = document.createElement('input');
        checkbox.type = "checkbox";
        checkbox.name = serie.serie_descripcion;
        checkbox.value = false;
        checkbox.id = serie.serie_id;
        $(checkbox).change(function() {
            if (this.checked) {
                selectedSeries.push(this.id)
            } else {
                selectedSeries.remove(this.id)
            }
            console.log(selectedSeries)
            updateApiUrl()
        })

        var serie_idColumn = document.createElement('td');
        serie_idColumn.innerText = serie.serie_id;

        var serie_descripcionColumn = document.createElement('td');
        serie_descripcionColumn.innerHTML = serie.serie_descripcion;

        var indice_tiempo_frecuenciaColumn = document.createElement('td');
        indice_tiempo_frecuenciaColumn.innerHTML = frequencyTranslation[serie.indice_tiempo_frecuencia];

        var tableRow = document.createElement('tr');
        tableRow.appendChild(checkbox);
        tableRow.appendChild(serie_idColumn);
        tableRow.appendChild(serie_descripcionColumn);
        tableRow.appendChild(indice_tiempo_frecuenciaColumn);

        indexedSeriesTBody.appendChild(tableRow);
    }
};

var updateSerieCountAndTable = function() {
    updateSerieCount(results.length);

    if (results.length > 0) {
        updateSeriesTable(results);
    } else if (!!searchInput.value) {
        updateSeriesTable([]);
    } else {
        updateSerieCount(filteredSeries.length);
        updateSeriesTable(filteredSeries);
    }
};

var searchSeries = function() {
    results = search.search(searchInput.value);
    updateSerieCountAndTable();
};

searchInput.oninput = searchSeries;

var updateSerieCount = function(numSeries) {
    serieCountBadge.innerText = numSeries + ' series';
};
var hideElement = function(element) {
    element.className += ' hidden';
};
var showElement = function(element) {
    element.className = element.className.replace(/\s*hidden/, '');
};

// var xmlhttp = new XMLHttpRequest();
// xmlhttp.onreadystatechange = function() {
//     if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {

//         var json = JSON.parse(xmlhttp.responseText);

//         allSeries = json.series;

//         updateSerieCount(allSeries.length);

//         var loadingProgressBar = document.getElementById('loadingProgressBar');
//         hideElement(loadingProgressBar);
//         showElement(indexedSeriesTable);

//         rebuildSearchIndex();
//         updateSeriesTable(allSeries);
//     }
// }
// xmlhttp.open('GET', 'series.json', true);
// xmlhttp.send();




// Removes an element from an array.
// String value: the value to search and remove.
// return: an array with the removed element; false otherwise.
Array.prototype.remove = function(value) {
    var idx = this.indexOf(value);
    if (idx != -1) {
        return this.splice(idx, 1); // The second parameter is the number of elements to remove.
    }
    return false;
}

function createParamFormat() {
    $("#apiParamFormatSelect").change(function() {
        format = $(this).val();
        updateApiUrl()
    })
}

function createParamHeader() {
    $("#apiParamHeaderSelect").change(function() {
        header = $(this).val();
        updateApiUrl()
    })
}

function createParamCollapse() {
    $("#apiParamCollapseSelect").change(function() {
        collapse = $(this).val();
        updateApiUrl()
    })
}

function createParamCollapseAggregation() {
    $("#apiParamCollapseAggregationSelect").change(function() {
        collapseAggregation = $(this).val();
        updateApiUrl()
    })
}

function createParamRepresentationMode() {
    $("#apiParamRepresentationModeSelect").change(function() {
        representationMode = $(this).val();
        updateApiUrl()
    })
}

function createParamStartDate() {
    $("#apiParamStartDatePicker").change(function() {
        startDate = $(this).find("input").val();
        updateApiUrl()
    })
}

function createParamEndDate() {
    $("#apiParamEndDatePicker").change(function() {
        endDate = $(this).find("input").val();
        updateApiUrl()
    })
}

function createFilterTheme(themes) {
    console.log(themes)

    // crea la lista de opciones
    $(themes).each(function() {
        $("#seriesFilterThemeSelect").append($("<option>").attr('value', this).text(this));
    });

    // selecciona el primero
    selectedTheme = themes[0]

    // agrega el comportamiento al seleccionar algun tema
    $("#seriesFilterThemeSelect").change(function() {
        selectedTheme = $(this).val();
        createFilterSource()
        filterSeriesTable()
    })
}

function createFilterFrequency(frequencies) {
    // crea la lista de opciones
    $("#seriesFilterFrequencySelect").append($("<option>"));
    $.each(frequencies, function(key, value) {
        $("#seriesFilterFrequencySelect").append($("<option>").attr('value', key).text(value));
    });

    // agrega el comportamiento al seleccionar algun tema
    $("#seriesFilterFrequencySelect").change(function() {
        selectedFrequency = $(this).val();
        filterSeriesTable()
    })
}

function createFilterSource() {

    // busca las fuentes de las series del tema seleccionado
    var sources = [];
    $.each(allSeries, function(i, serie) {
        if (
            (serie.dataset_tema == selectedTheme) &&
            (sources.indexOf(serie.dataset_fuente) === -1)
        ) {
            sources.push(serie.dataset_fuente)
        }
    })
    console.log(sources)

    // crea la lista de opciones
    $("#seriesFilterSourceSelect").empty()
    $("#seriesFilterSourceSelect").append($("<option>"));
    $(sources).each(function() {
        $("#seriesFilterSourceSelect").append($("<option>").attr('value', this).text(this));
    });

    // agrega el comportamiento al seleccionar alguna
    $("#seriesFilterSourceSelect").change(function() {
        selectedSource = $(this).val();
        filterSeriesTable()
    })
}


function filter_function(serie_object) {
    return (serie_object.dataset_tema == selectedTheme) && (!selectedSource || serie_object.dataset_fuente == selectedSource) && (!selectedFrequency || serie_object.indice_tiempo_frecuencia == selectedFrequency)
}

function filterSeriesTable() {
    filteredSeries = allSeries.filter(filter_function);
    updateSerieCount(filteredSeries.length);

    var loadingProgressBar = document.getElementById('loadingProgressBar');
    hideElement(loadingProgressBar);
    showElement(indexedSeriesTable);

    rebuildSearchIndex();
    updateSeriesTable(filteredSeries);
}

$(function() {
    updateApiUrl()
    $('.datepicker').datepicker({
        format: 'yyyy-mm-dd',
        startDate: ''
    });

    createParamFormat();
    createParamHeader();
    createParamCollapse();
    createParamCollapseAggregation();
    createParamRepresentationMode();
    createParamStartDate();
    createParamEndDate();

    var series;
    $.ajax({
        type: "GET",
        url: "./public/data/series-tiempo-metadatos.csv",
        dataType: "text",
        success: function(response) {
            // carga los metadatos de todas las series en memoria
            allSeries = $.csv.toObjects(response);

            // lista los temas de las series y crea el filtro
            var themes = [];
            $.each(allSeries, function(i, serie) {
                if (themes.indexOf(serie.dataset_tema) === -1) {
                    themes.push(serie.dataset_tema)
                }
            })
            createFilterTheme(themes);
            createFilterSource();
            createFilterFrequency(frequencyTranslation);

            filterSeriesTable();
        }
    });
});
