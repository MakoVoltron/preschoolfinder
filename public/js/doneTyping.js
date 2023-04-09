    // ADD DELAY TO QUERING SCHOOL DATABASE WHILE ADDING PRICE
    let typingTimer;
    let doneTypingInterval = 500;

    // on keyup, start the countdown
    maxPrice.addEventListener('keyup', () => {
    
        clearTimeout(typingTimer);
        if (maxPrice.value) {
            typingTimer = setTimeout(doneTyping, doneTypingInterval);
        } else {
            price.max = '';
            searchArea(bounds, selected, price)
        }
    });

    // do something after user finishes typing
    function doneTyping() {
        if (maxPrice.value != '') {
            price.max = maxPrice.value;   
        } else {
            price.max = '';
        }
        searchArea(bounds, selected, price)
    }