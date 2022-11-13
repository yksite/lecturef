var myColor = 'yellow';

var peer = new Peer();
var conn;

setTimeout(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const key = urlParams.get('key');
    conn = peer.connect(key);

    //when connected
    conn.on('open', function(){
        //stop window refreshing
        window.stop();
        //signal connection worked
        conn.send({
            type: 'status',
            value: 'connected'
        });

        conn.on('data', function(data){
            receivedData(data);
        });
    });
}, 1000);

function sendData(data) {
    conn.send(data);
}
function receivedData(data) {
    console.log(data);
            switch (data.type) {
                case 'text':
                    displayText(data);
                    break;

                case 'message':
                    displayMessage(data.content);
                    break;

                case 'highlight':
                    applyHighlight(data.highlight);
                    break;

                case 'hlrefresh':
                    data.highlights.forEach(highlight => applyHighlight(highlight));
                    break;

                case 'refresh':
                    location.reload();
                    break;
        
                default:
                    break;
            }
}

var spaceIndexes = [-1];
function displayText(text) {
    document.getElementById('title').innerText = text.title;

    document.getElementById('author').innerText = text.author;
    document.getElementById('work').innerText = text.work;
    document.getElementById('year').innerText = text.year;

    var textbody = document.getElementById('textbody');
    var charIndex = 0;
    text.body.forEach((paragraph) => {
        var paragraphElem = document.createElement('p');

        //split into characters and add each to a separate span element with unique id and common class
        var paragraphChars = paragraph.split('');
        paragraphChars.forEach((char) => {
            if(char.trim().length == 0) {
                spaceIndexes.push(charIndex);
            }
            var charElem = document.createElement('span');
            charElem.innerText = char;
            charElem.id = `c${charIndex}`;
            charElem.setAttribute('class', 'char');
            charElem.addEventListener('click', charClicked);
            paragraphElem.appendChild(charElem);
            charIndex++;
        });
        //ghost character to separate paragraphs
        spaceIndexes.push(charIndex);
        charIndex++;

        textbody.appendChild(paragraphElem);
    });

    doneLoading(text.title);
}

function doneLoading(textName) {
    document.getElementById('loader').style.display = "none";
    document.title = textName;
}

function charClicked(e) {
    console.log(e.target.id.substring(1));
    //if word not highlighted, highlight it
    if(e.target.style.backgroundColor.length == 0 || e.target.style.backgroundColor == 'transparent') {
        floodHighlight(e.target.id.substring(1), myColor);
    } else {
        floodHighlight(e.target.id.substring(1), 'transparent');
    }
    
}

//highlights all adjacent non space characters
function floodHighlight(charIndex, color) {
    //define highlight boundaries
    var followingSpace = spaceIndexes.findIndex(spaceIndex => spaceIndex > charIndex);
    var begginingChar = spaceIndexes[followingSpace-1]+1;
    var finalChar = spaceIndexes[followingSpace]-1;
    var highlight = {
        start: begginingChar,
        end: finalChar,
        color: color
        }
    
    //send and apply highlight
    sendData({
        type: 'highlight',
        highlight: highlight
    });
    applyHighlight(highlight);
}

function highlightSelected(color) {
    var selection = window.getSelection();
    var char1 = parseInt(selection.anchorNode.parentNode.id.substring(1), 10);
    var char2 = parseInt(selection.focusNode.parentNode.id.substring(1), 10);
    if(char1 < char2) {
        begginingChar = char1;
        finalChar = char2;
    } else {
        begginingChar = char2;
        finalChar = char1;
    }

    var highlight = {
        start: begginingChar,
        end: finalChar,
        color: color
        }
    console.log(highlight);

    //send and apply highlight
    sendData({
        type: 'highlight',
        highlight: highlight
    });
    applyHighlight(highlight);
    //reset selection
    window.getSelection().removeAllRanges();
}

function applyHighlight(highlight) {
    for (let index = highlight.start; index <= highlight.end; index++) {
        highlightChar(index, highlight.color);
    }
}

function highlightChar(charIndex, color) {
    document.getElementById(`c${charIndex}`).style.backgroundColor = color;
}

function displayMessage(text) {
    var messageBox = document.getElementById('post-it');
    if(text.length == 0) {
        messageBox.style.display = 'none';
    } else {
        messageBox.style.display = 'block';
        messageBox.innerText = text;
    }
}