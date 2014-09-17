var BAD_TAGS = /editor|comment|rss|pagination|footer|header|popup/i;
var INVALID_TAGS = /form|img|script|combx|comment|community|disqus|extra|foot|header|menu|remark|rss|shoutbox|sidebar|sponsor|ad-break|agegate|pagination|pager|popup|tweet|twitter/i;
var VALID_TAGS = ["P", "TD", "PRE"];
var INVALID_INNER_DIV_TAGS = /<(a|blockquote|dl|div|ol|p|pre|table|ul)/i;

//----------------------------------------------------------------------------------------------
// PAGE CONTENT DISCOVERY
//----------------------------------------------------------------------------------------------
function get_possible_elements() {
    content_div = document.getElementById('raw_content');

    var elements = content_div.getElementsByTagName('*');

    nodes_to_validate = [];
    for (var i = 0; i < elements.length; i++) {
        var el = elements[i];

        tag_name = el.tagName;
        if (tag_name.search(INVALID_TAGS) === -1) {
            if (VALID_TAGS.indexOf(tag_name) !== -1) {
                nodes_to_validate.push(el);
            }
            else if (tag_name === 'DIV') {
                if (!is_bad_element(el)) {
                    nodes_to_validate.push(el);
                }
            }
        }
    }

    return nodes_to_validate;
}

function is_bad_element(el, debug) {


    if (el === null) {
        return true;
    }

    if (el.innerHTML === undefined) {
        return true;
    }

    if (el.innerHTML.search(INVALID_INNER_DIV_TAGS) !== -1) {
        return true;
    }

    var id_class = el.id + '_' + el.className;
    var parent_el = el.parentNode;

    if (id_class.search(BAD_TAGS) !== -1) {
        return true;
    }

    return false;
}

function score_possible_elements(possible_elements) {

    var chosen_element = null;

    for (var i = 0; i < possible_elements.length; i++)
    {
        var el = possible_elements[i];
        var parent_el = el.parentNode;
        var grand_parent_el = parent_el ? parent_el.parentNode : null;
        var inner_text = el.textContent;

        if (inner_text === undefined) {
            continue;
        }

        if (parent_el === undefined || parent_el === null) {
            continue;
        }

        if (parent_el.tagName === 'undefined') {
            continue;
        }

        if (inner_text.length < 50) {
            continue;
        }

        var score = 0;
        score += Math.min(Math.floor(inner_text.length / 100), 3);

        score += inner_text.split(',').length;
        score +- inner_text.split(';').length;
        score += inner_text.split('?').length;

        if (el.body_score === undefined) {
            el.body_score = score;
        } else {
            el.body_score += score;
        }

        if (parent_el.body_score === undefined) {
            parent_el.body_score = score;
        } else {
            parent_el.body_score += score;
        }

        if (chosen_element === null) {
            chosen_element = parent_el;
        } else if (el.body_score > chosen_element.body_score) {
            chosen_element = el;
        }

        if (parent_el.body_score > chosen_element.body_score) {
            chosen_element = parent_el;
        }

        if (grand_parent_el.body_score > chosen_element.body_score) {
            chosen_element = grand_parent_el;
        }
    }

    return chosen_element;
}

function get_title() {
    content_div = document.getElementById('raw_content');
    var header = content_div.getElementsByTagName('h1');

    if (header.length === 0) {
        return document.getElementsByTagName('title')[0].textContent;
    }

    return header[0].textContent;
}


function discovery() {
    nodes_to_validate = get_possible_elements();
    best_element = score_possible_elements(nodes_to_validate);

    if (best_element === null) {
        return {
            body: "bodyizer could not find any suitable element to showcase!",
            ngrams: {}
        };
    } else {

        var content = remove_elements(best_element.innerHTML);

        return {
            body: content,
            ngrams: parse_ngrams(best_element),
            title: get_title()
        };
    }
}

function remove_elements(content) {
    var object = /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi;
    var script = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    var style = /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi;
    var fieldset = /<fieldset\b[^<]*(?:(?!<\/fieldset>)<[^<]*)*<\/fieldset>/gi;

    var button = /<button[^>]*>/gi;
    var input = /<input[^>]*>/gi;
    // var img = /<img[^>]*>/gi;

    content = content.replace(object, "");
    content = content.replace(script, "");
    content = content.replace(style, "");
    content = content.replace(fieldset, "");

    content = content.replace(input, "");
    // content = content.replace(img, "");
    content = content.replace(button, "");

    return content;
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function parse_ngrams(el) {
    var text = el.textContent;
    var mongograms = text.match(/\w+/g);

    var monogram_counts = {};
    var bi_gram = ['', ''];

    for (var i = 0; i < mongograms.length; i++) {
        var monogram = mongograms[i].toLocaleLowerCase();

        if (isNumber(monogram)) {
            continue;
        }

        if (monogram.length <= 2) {
            continue;
        }

        if (monogram_counts[monogram] === undefined) {
            monogram_counts[monogram] = 0;
        }

        bi_gram[0] = bi_gram[1];
        bi_gram[1] = monogram;

        var bg = bi_gram.join(' ');

        if (monogram_counts[bg] === undefined) {
            monogram_counts[bg] = 0;
        }

        monogram_counts[monogram] += 1;
        monogram_counts[bg] += 1;
    }

    return monogram_counts;
}
