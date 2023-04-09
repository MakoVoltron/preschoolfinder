const openSearch = document.getElementById('add-btn');
    const btnIcon = document.querySelector('.btn-icon');
    const btnSpinner = document.querySelector('.btn-spinner');
    const addBox = document.getElementById('add-container');
    const resultsContainer = document.getElementById('results-container');
    const closeSearch = document.querySelector('#add-container .btn-close');
    const autocompleteInput = document.getElementById('autocomplete');

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

// autocompleteInput.addEventListener('keyup', (e) => {
//     const userInput = e.target.value;
//     console.log(userInput)
// })

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
                    item.addEventListener('click', (e) => {
            
                        const id = e.target.dataset.id;
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
                                console.log(place);
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


// function initAutocomplete() {
    //     const options = {
    //         types: ['school'],
    //         componentRestrictions: {'country': ['cz']},
    //         fields: ['place_id', 'name', 'geometry', 'formatted_address'],
    //         bounds: defaultBounds,
    //         strictBounds: false // make sure to change to true once implementing 'bounds' parameter
    //     }

    //     // create autocomplete function
    //     autocomplete = new google.maps.places.Autocomplete(
    //         document.getElementById('autocomplete'),
    //         options
    //     );
    //     autocomplete.addListener('place_changed', onPlaceChanged);
    // }

    // function onPlaceChanged() {
    //     let place = autocomplete.getPlace();
    //     let latitude = place.geometry.location.lat();
    //     let longitude = place.geometry.location.lng();

    //     if (!place.geometry) {
    //         // User did not select prediction. Reset input field
    //         document.getElementById('autocomplete').placeholder = 'Enter a place';
    //     } else {
    //         // Display details about valid place
    //         document.getElementById('details').innerHTML = `
    //             ${place.name} 
    //             <br> 
    //             ${place.formatted_address}
    //             <br>
    //             PlaceID: ${place.place_id}
    //             <br>
    //             Lat: ${latitude} | Long: ${longitude}
    //             `;
    //         console.log(place)
    //     }
    // }