const BASE_API_URL = "http://apis.datos.gob.ar/series/api";
var search, results, selectedSeries = [],
    allSeries = [],
    filteredSeries = [];
var seriesCollAgg = {},
    seriesRepMode = {};
var format, header, collapse, collapseAggregation, representationMode = "";
var limit, start, sort = "";
var startDate, endDate, selectedTheme, selectedSource, selectedFrequency = "";
var selectedUpdatedStatus = "True";
var frequencyTranslation = {
    "R/P1Y": "Anual",
    // "R/P6M": "Semestral",
    "R/P3M": "Trimestral",
    "R/P1M": "Mensual",
    "R/P1W": "Semanal",
    "R/P1D": "Diaria"
}
var colors = [
    "#e6194b", "#3cb44b", "#ffe119", "#0082c8", "#f58231", "#911eb4", "#46f0f0", "#f032e6", "#d2f53c", "#fabebe", "#008080", "#e6beff", "#aa6e28", "#fffac8", "#800000", "#aaffc3", "#808000", "#ffd8b1", "#000080", "#808080", "#FFFFFF", "#000000"
]


function generateIds() {
    var idsParam = [];
    $.each(selectedSeries, function(index, serie_id) {
        var idStr = serie_id;
        if (seriesCollAgg[serie_id]) {
            idStr = idStr + ":" + seriesCollAgg[serie_id]
        }
        if (seriesRepMode[serie_id]) {
            idStr = idStr + ":" + seriesRepMode[serie_id]
        }

        idsParam.push(idStr)
    })
    return idsParam.join(",")
}

function updateApiUrl(baseApiUrl = BASE_API_URL) {
    // genero URL base con los ids solicitados
    apiUrl = baseApiUrl + "/series?ids=" + generateIds()

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

    // crea el gráfico con la URL antes de pasarle el formato (default)
    // cantidad máxima de resultados
    if (limit) {
        apiUrl = apiUrl + "&limit=" + limit
    }

    // resultados iniciales a saltear
    if (start) {
        apiUrl = apiUrl + "&start=" + start
    }

    // orden de los resultados
    if (sort) {
        apiUrl = apiUrl + "&sort=" + sort
    }

    console.log(apiUrl)
    createChart(apiUrl)

    // formato
    if (format) {
        apiUrl = apiUrl + "&format=" + format
    }

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

        // selector de serie
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

        // Identificador de serie
        var serie_idColumn = document.createElement('td');
        serie_idColumn.innerText = serie.serie_id;

        // Descripción de serie
        var serie_descripcionColumn = document.createElement('td');
        serie_descripcionColumn.innerHTML = serie.serie_descripcion;

        // Frecuencia de serie
        var indice_tiempo_frecuenciaColumn = document.createElement('td');
        indice_tiempo_frecuenciaColumn.innerHTML = frequencyTranslation[serie.indice_tiempo_frecuencia];

        // selector de función de agregación
        var collapse_aggregationColumn = document.createElement('td');
        collapse_aggregationColumn.innerHTML = "<div><select serie_id='" + serie.serie_id + "' class='form-control'><option></option><option value='avg'>Promedio</option><option value='sum'>Suma</option><option value='end_of_period'>Último</option><option value='max'>Máximo</option><option value='min'>Mínimo</option></select></div>"
        $(collapse_aggregationColumn).find("select").change(function() {
            seriesCollAgg[$(this).attr("serie_id")] = $(this).val();
            updateApiUrl()
        })

        // selector de modo de representación
        var representation_modeColumn = document.createElement('td');
        representation_modeColumn.innerHTML = "<div><select serie_id='" + serie.serie_id + "' class='form-control'><option></option><option value='change'>Variación</option><option value='change_a_year_ago'>Variación hace un año</option><option value='percent_change'>Variación %</option><option value='percent_change_a_year_ago'>Variación % hace un año</option></select></div>"
        $(representation_modeColumn).find("select").change(function() {
            seriesRepMode[$(this).attr("serie_id")] = $(this).val();
            updateApiUrl()
        })

        // crea nueva fila de la tabla
        var tableRow = document.createElement('tr');
        tableRow.appendChild(checkbox);
        tableRow.appendChild(serie_idColumn);
        tableRow.appendChild(serie_descripcionColumn);
        tableRow.appendChild(indice_tiempo_frecuenciaColumn);
        tableRow.appendChild(collapse_aggregationColumn);
        tableRow.appendChild(representation_modeColumn);

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

var updateSerieCount = function(numSeries, numTotalSeries) {
    serieCountBadge.innerText = numSeries + ' series de ' + numTotalSeries + ' en total';
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

function createParamLimit() {
    $("#apiParamLimitInput").change(function() {
        limit = $(this).val();
        updateApiUrl()
    })
}

function createParamStart() {
    $("#apiParamStartInput").change(function() {
        start = $(this).val();
        updateApiUrl()
    })
}

function createParamSort() {
    $("#apiParamSortSelect").change(function() {
        sort = $(this).val();
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
    $("#seriesFilterFrequencySelect").append($("<option>").text("Todas"));
    $.each(frequencies, function(key, value) {
        $("#seriesFilterFrequencySelect").append($("<option>").attr('value', key).text(value));
    });

    // agrega el comportamiento al seleccionar algun tema
    $("#seriesFilterFrequencySelect").change(function() {
        selectedFrequency = $(this).val();
        filterSeriesTable()
    })
}

function createFilterUpdated() {
    // agrega el comportamiento al seleccionar algun tema
    $("#seriesFilterUpdatedSelect").change(function() {
        selectedUpdatedStatus = $(this).val();
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
    $("#seriesFilterSourceSelect").append($("<option>").text("Todas"));
    $(sources).each(function() {
        $("#seriesFilterSourceSelect").append($("<option>").attr('value', this).text(this));
    });

    // agrega el comportamiento al seleccionar alguna
    $("#seriesFilterSourceSelect").change(function() {
        selectedSource = $(this).val();
        filterSeriesTable()
    })
}

function filterCompare(selectedValue, comparingValue) {
    return (!selectedValue || selectedValue == "Todas" || comparingValue == selectedValue)
}

function filterFunction(serie_object) {
    // console.log(selectedUpdatedStatus)
    // console.logdserie_object.serie_actualizada)
    return (serie_object.dataset_tema == selectedTheme) && filterCompare(selectedSource, serie_object.dataset_fuente) && filterCompare(selectedFrequency, serie_object.indice_tiempo_frecuencia) && filterCompare(selectedUpdatedStatus, serie_object.serie_actualizada)
}

function filterSeriesTable() {
    filteredSeries = allSeries.filter(filterFunction);
    updateSerieCount(filteredSeries.length, allSeries.length);

    var loadingProgressBar = document.getElementById('loadingProgressBar');
    hideElement(loadingProgressBar);
    showElement(indexedSeriesTable);

    rebuildSearchIndex();
    updateSeriesTable(filteredSeries);
}

function getColor(index) {
    colorIndex = index - Math.floor(index / colors.length) * colors.length
    return colors[colorIndex]
}

function parseDate(date, frequency) {
    if (frequency == "year") {
        return moment(date, "YYYY-MM-DD").format("YYYY")
    }
    if (frequency == "quarter") {
        return moment(date, "YYYY-MM-DD").format("YYYY-MM")
    }
    if (frequency == "month") {
        return moment(date, "YYYY-MM-DD").format("YYYY-MM")
    }
    if (frequency == "week") {
        return moment(date, "YYYY-MM-DD").format("YYYY-MM-DD")
    }
    if (frequency == "day") {
        return moment(date, "YYYY-MM-DD").format("YYYY-MM-DD")
    }
    return date
}

function parseApiCall(response) {
    var timeIndex = [],
        series = [];

    // extrae las descripciones de las series
    $.each($(response["meta"]).slice(1), function(col_i, col_meta) {
        var color = getColor(col_i)
        series.push({
            "label": col_meta["dataset"][0]["distribution"][0]["field"][0]["description"],
            "backgrounColor": color,
            "borderColor": color,
            "fill": false,
            "data": []
        })
    })

    // extrae los valores de cada fila y cada columna
    $.each(response["data"], function(row_i, row_data) {
        timeIndex.push(parseDate(row_data[0], response["meta"][0]["frequency"]))
        $.each(row_data.slice(1), function(col_i, col_value) {
            series[col_i]["data"].push(col_value)
        })
    })

    return { "timeIndex": timeIndex, "series": series }
}

function createPngImage() {
    var url_base64png = document.getElementById("myChart").toDataURL("image/png");
    $("#downloadChart").attr("href", url_base64png);
}

function createChart(apiUrl) {
    $.getJSON(apiUrl, function(response) {
        var parsedResponse = parseApiCall(response);

        // despliega el gráfico si no estaba visible
        $("#chartSection").slideDown()

        var ctx = document.getElementById("myChart").getContext('2d');
        var myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: parsedResponse["timeIndex"],
                datasets: parsedResponse["series"]
            },
            options: {
                animation: {
                    onComplete: createPngImage
                },
                responsive: true,
                tooltips: {
                    mode: "index",
                    intersect: false
                },
                hover: {
                    mode: "nearest",
                    intersect: true
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: false
                        }
                    }]
                }
            }
        });
    }).fail(function() {
        // repliega el gráfico si estaba visible
        $("#chartSection").slideUp()
    });
}

function setEsDatepickerLocale($) {
    $.fn.datepicker.dates['es'] = {
        days: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
        daysShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
        daysMin: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"],
        months: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
        monthsShort: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
        today: "Hoy"
    };
};

$(function() {
    // URL base de la API
    updateApiUrl()

    // calendarios
    setEsDatepickerLocale($)
    $('.datepicker').datepicker({
        weekStart: 1,
        viewMode: 'years',
        defaultViewDate: "year",
        startView: "years",
        immediateUpdates: true,
        todayHighlight: true,
        forceParse: false,
        clearBtn: true,
        changeMonth: true,
        changeYear: true,
        showButtonPanel: true,
        format: 'yyyy-mm-dd',
        startDate: '',
        language: "es"
    });

    // parámetros generales
    createParamFormat();
    createParamHeader();
    createParamCollapse();
    createParamCollapseAggregation();
    createParamRepresentationMode();
    createParamStartDate();
    createParamEndDate();
    createParamLimit();
    createParamStart();
    createParamSort();

    // búsqueda y filtro de series
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
            createFilterUpdated();
            createFilterFrequency(frequencyTranslation);

            filterSeriesTable();
            // createChart("./public/data/api-call-example.json");
            createChart();
        }
    });
});
