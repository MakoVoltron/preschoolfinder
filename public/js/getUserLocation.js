// // get user location
// let defaultBounds = {};
// const getUserCoordinates = (callback) => {
//     function success(pos) {
//         const crd = pos.coords;
//         defaultBounds.north = crd.latitude + 0.05;
//         defaultBounds.south = crd.latitude - 0.05;
//         defaultBounds.east = crd.longitude + 0.05;
//         defaultBounds.west = crd.longitude - 0.05;
//         console.log("User location coordinates has been defined: ")
//         console.log(defaultBounds)
//         callback();
//     }

//     function error(err) {
//         console.warn(`ERROR(${err.code}): ${err.message}`);
//     }

//     navigator.geolocation.getCurrentPosition(success, error)
// }
// // getUserCoordinates();