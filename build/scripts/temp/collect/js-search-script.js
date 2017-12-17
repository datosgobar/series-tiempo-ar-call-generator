var search, results, allBooks, selectedSeries = [];
var format, header, collapse, collapseAggregation = "";

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

    console.log(apiUrl)
    $("#apiUrl").text(apiUrl)
    $("#apiUrl").attr("href", apiUrl)
}

var indexOndataset_temaCheckbox = document.getElementById('indexOndataset_temaCheckbox');
var indexStrategySelect = document.getElementById('indexStrategySelect');
var removeStopWordsCheckbox = document.getElementById('removeStopWordsCheckbox');
var indexOnserie_descripcionCheckbox = document.getElementById('indexOnserie_descripcionCheckbox');
var useStemmingCheckbox = document.getElementById('useStemmingCheckbox');
var sanitizerSelect = document.getElementById('sanitizerSelect');
var tfIdfRankingCheckbox = document.getElementById('tfIdfRankingCheckbox');

var rebuildAndRerunSearch = function() {
    rebuildSearchIndex();
    searchBooks();
};

indexOndataset_temaCheckbox.onchange = rebuildAndRerunSearch;
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
    if (indexOndataset_temaCheckbox.checked) {
        search.addIndex('dataset_tema');
    }

    search.addDocuments(allBooks);
};

var indexedBooksTable = document.getElementById('indexedBooksTable');
var indexedBooksTBody = indexedBooksTable.tBodies[0];
var searchInput = document.getElementById('searchInput');
var bookCountBadge = document.getElementById('bookCountBadge');

var updateBooksTable = function(books) {
    indexedBooksTBody.innerHTML = '';

    var tokens = search.tokenizer.tokenize(searchInput.value);

    for (var i = 0, length = books.length; i < length; i++) {
        var book = books[i];

        var checkbox = document.createElement('input');
        checkbox.type = "checkbox";
        checkbox.name = book.serie_descripcion;
        checkbox.value = false;
        checkbox.id = book.serie_id;
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
        serie_idColumn.innerText = book.serie_id;

        var serie_descripcionColumn = document.createElement('td');
        serie_descripcionColumn.innerHTML = book.serie_descripcion;

        var dataset_temaColumn = document.createElement('td');
        dataset_temaColumn.innerHTML = book.dataset_tema;

        var tableRow = document.createElement('tr');
        tableRow.appendChild(checkbox);
        tableRow.appendChild(serie_idColumn);
        tableRow.appendChild(serie_descripcionColumn);
        tableRow.appendChild(dataset_temaColumn);

        indexedBooksTBody.appendChild(tableRow);
    }
};

var updateBookCountAndTable = function() {
    updateBookCount(results.length);

    if (results.length > 0) {
        updateBooksTable(results);
    } else if (!!searchInput.value) {
        updateBooksTable([]);
    } else {
        updateBookCount(allBooks.length);
        updateBooksTable(allBooks);
    }
};

var searchBooks = function() {
    results = search.search(searchInput.value);
    updateBookCountAndTable();
};

searchInput.oninput = searchBooks;

var updateBookCount = function(numBooks) {
    bookCountBadge.innerText = numBooks + ' books';
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

//         allBooks = json.books;

//         updateBookCount(allBooks.length);

//         var loadingProgressBar = document.getElementById('loadingProgressBar');
//         hideElement(loadingProgressBar);
//         showElement(indexedBooksTable);

//         rebuildSearchIndex();
//         updateBooksTable(allBooks);
//     }
// }
// xmlhttp.open('GET', 'books.json', true);
// xmlhttp.send();


function filter_function(serie_object) {
    return serie_object.dataset_tema == "Actividad"
}

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
    $("#apiParamFormatSelect").change(function () {
        format = $(this).val();
        updateApiUrl()
    })
}

function createParamHeader() {
    $("#apiParamHeaderSelect").change(function () {
        header = $(this).val();
        updateApiUrl()
    })
}

function createParamCollapse() {
    $("#apiParamCollapseSelect").change(function () {
        collapse = $(this).val();
        updateApiUrl()
    })
}

function createParamCollapseAggregation() {
    $("#apiParamCollapseAggregationSelect").change(function () {
        collapseAggregation = $(this).val();
        updateApiUrl()
    })
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

    var series;
    $.ajax({
        type: "GET",
        url: "./public/data/series-tiempo-metadatos.csv",
        dataType: "text",
        success: function(response) {
            // add series from csv to results list
            series = $.csv.toObjects(response);
            allBooks = series.filter(filter_function);
            updateBookCount(allBooks.length);

            var loadingProgressBar = document.getElementById('loadingProgressBar');
            hideElement(loadingProgressBar);
            showElement(indexedBooksTable);

            rebuildSearchIndex();
            updateBooksTable(allBooks);
        }
    });
});
