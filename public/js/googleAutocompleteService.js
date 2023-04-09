const openSearch = document.getElementById('add-btn');
    const btnIcon = document.querySelector('.btn-icon');
    const btnSpinner = document.querySelector('.btn-spinner');
    const addBox = document.getElementById('add-container');
    const resultsContainer = document.getElementById('results-container');
    const closeSearch = document.querySelector('#add-container .btn-close');
    const autocompleteInput = document.getElementById('autocomplete');
    const vote = document.querySelectorAll('.emoji-btn');
    const cardOne = document.querySelector('[data-card="1"]');
    const reviewProgress = document.querySelector('.review-progress');
    const reviewCards = document.querySelectorAll('.review-card');
    const finalCard = document.querySelector('.final-card');

// progress bar
let fragment = 100 / reviewCards.length;
reviewProgress.style.width = `${5}%`;

cardOne.classList.remove('hide');

vote.forEach(el => { 
    el.addEventListener('click', (e) => {
        let currentCard = e.target.closest('.review-card');
        let currentCardNumber = parseInt(e.target.closest('.review-card').dataset.card);
        currentCardNumber++
        let nextCard = document.querySelector(`[data-card="${currentCardNumber}"]`)
        reviewProgress.style.width = `${(fragment * currentCardNumber)}%`
        nextCard.classList.remove('hide');
        currentCard.classList.add('hide');
        // identify last card and add fade out
        if (!finalCard.classList.contains('hide')) {
            setTimeout(function() {
                addBox.classList.add('fade-out')
            }, 2000)
        }
    })
})




openSearch.addEventListener('click', () => {
    if (center == undefined) {
        btnIcon.classList.add('hide');
        btnSpinner.classList.remove('hide');
    } else {
        addBox.classList.remove('hide');
    }
})

closeSearch.addEventListener('click', () => {
    addBox.classList.add('hide');
})

let autocomplete, center;
let defaultBounds = {};

function initAutocompleteService() {
    const service = new google.maps.places.AutocompleteService();

    autocompleteInput.addEventListener('keyup', (e) => {
        const userInput = e.target.value;

        // activate if user types at least 3 characters
        if (userInput.length >= 3) {
            // Create a new session token.
            const sessionToken = new google.maps.places.AutocompleteSessionToken();

            const request = {
                input: userInput,
                types: ['school'],
                location: new google.maps.LatLng(center[0], center[1]),
                radius: 3000,
                sessionToken: sessionToken,
                // fields: ['place_id', 'name', 'geometry', 'formatted_address', 'website']
                // bounds: defaultBounds
            }

            service.getPlacePredictions(request, function(predictions, status) {
                console.log(predictions)
                // remove all previous search results
                resultsContainer.innerHTML = '';
                
                for (let i = 0; i < 5; i++) {
                    const div = document.createElement('div');
                    div.classList.add('pac-prediction-pill')
                    div.textContent = predictions[i].structured_formatting.main_text;
                    div.dataset.id = predictions[i].place_id;
                    resultsContainer.append(div);
                }

                const items = document.querySelectorAll('.pac-prediction-pill');
                items.forEach(item => {
                    console.log(item)
                    item.addEventListener('click', (e) => {
                        const id = e.target.dataset.id;
                        

                        // check database if the school doesn't exist already
                        

                        // if yes, cancel the review processs
                        // if the place was approved/verified, link to listing
                        // if the listing is pending, give information

                        // else continue review process
            
                        console.log(id)
                        let req = {
                            placeId: id,
                            fields: ['name', 'formatted_address', 'geometry']
                        };
                        console.log(e.target)
                        let placeService = new google.maps.places.PlacesService(resultsContainer);
                        placeService.getDetails(req, callback)

                        function callback(place, status) {
                            if (status == google.maps.places.PlacesServiceStatus.OK) {
                                let latitude = place.geometry.location.lat();
                                let longitude = place.geometry.location.lng();
                                let name = place.name;
                                let address = place.formatted_address;
                                console.log(place);
                                console.log(latitude)
                                console.log(longitude)
                            }
                        }
                    })
                })
            })

        } else {
            document.getElementById('results-container').innerHTML = '';
        }            
    })        
}

// FIRST get user location and create bounds, 
// THEN initialize (callback...) autocomplete and add defined bounds
const getUserCoordinates = (callback) => {
    // show loading spinner
    
    // get coordinates
    function success(pos) {
        const crd = pos.coords;
        center = [crd.latitude, crd.longitude];
        console.log(center)
        const distance = 0.05 // 0.05 equals 5km 
        defaultBounds.north = crd.latitude + distance;
        defaultBounds.south = crd.latitude - distance;
        defaultBounds.east = crd.longitude + distance;
        defaultBounds.west = crd.longitude - distance;

        // hide spinner
        btnIcon.classList.remove('hide');
        btnSpinner.classList.add('hide');
        addBox.classList.remove('hide');

        callback();
    }

    function error(err) {
        console.warn(`ERROR(${err.code}): ${err.message}`);
    }
    
    navigator.geolocation.getCurrentPosition(success, error)    
}

// this function compilation is called by Google Maps script that requires callback 
function callbackFunc() {
    if (center == undefined) {
        getUserCoordinates(initAutocompleteService)
    } else {
        initAutocompleteService();
    }
}