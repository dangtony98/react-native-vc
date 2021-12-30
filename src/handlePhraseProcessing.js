const parsePartialResults = (partialResultsText) => {
    // returns array representation of [text] that is lowercase

    return partialResultsText.toLowerCase().split(' ');
};

const updateWindow = (partialResultsArr, windowSize, setPartialResults) => {
    // updates partialResults results based on [windowSize]
    if (partialResultsArr.length > windowSize) {
        // case: [partialResultsArr] is larger than [windowSize]

        // remove first element
        partialResultsArr.shift();

        console.log('reached??');
        console.log([partialResultsArr.join(' ')]);
        
        setPartialResults([partialResultsArr.join(' ')]);
    }
}

// const checkForPhrase = (partialResultsArr, phrases) => {
//     phrases.forEach(phrase, index => {
//     });
//     return;
// }

export { parsePartialResults, updateWindow };