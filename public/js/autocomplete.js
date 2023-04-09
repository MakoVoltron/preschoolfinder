// !!!IMPORTANT - need to change when you go live
let domain = 'http://localhost:3000'

$(function () {
    $.widget( "custom.catcomplete", $.ui.autocomplete, {
        _create: function() {
            this._super();
            this.widget().menu( "option", "items", "> :not(.ui-autocomplete-category)" );
        },
        _renderMenu: function( ul, items ) {

            if (items.length == 0) {
                alert("empty array")
            }

            let that = this;
            currentCategory = "";
            $.each( items, function( index, item ) {
                let li;
                if ( item.category != currentCategory) {
                    if (item.category === "City") {
                        ul.append( "<li class='ui-autocomplete-category'>" + "Location" + "</li>");
                        currentCategory = item.category;
                    }

                    if (item.category === "School") {
                        ul.append( "<li class='ui-autocomplete-category'>" + "School" + "</li>");
                        currentCategory = item.category;
                    }
                }

                li = that._renderItemData( ul, item);
                if ( item.category ) {
                    li.attr( "aria-label", item.category + " : " + item.label)
                }
            });
        }
    });

    $('#search-input').catcomplete({
        source: async function(req, res) {

            let uniqueCities = [];
            let listings = [];
            let output = []; // final output object to be send to autocomplete

            let data = await fetch(`${domain}/search?query=${req.term}&searchFilter=cities`)
                .then(results => results.json())
                .then(results => results.map(result => {
                    console.log(result)

                    let city = {
                        city: result.city.name,
                        country: result.country.name,
                        region: result.context.region,
                        geometry: result.geometry
                    }

                    // let listing = {
                    //     title: result.title,
                    //     city: result.city.name,
                    //     country: result.country.name,
                    //     geometry: result.geometry
                    // }

                    // check if the city from the result is unique
                    // if yes, add to array for further processing
                    if (uniqueCities.map((e) => {
                        return e.city
                    }).indexOf(city.city) == -1) {
                        uniqueCities.push(city)
                    }

                    // listings.push(listing)

                    // return { label: result.city.name, value: result.city.name, country: result.country.name }
                    // return { label: result.city.name, value: result.city.name, country: result.country.name }
                }))

            uniqueCities.slice(0,5).forEach(el => output.push({label: el.city + ', ' + el.country, value: el.city, category: "City", cityCenter: el.geometry.coordinates}))
            // console.log(listings)
            // listings.slice(0,5).forEach(el => output.push({label: el.title + ', ' + ' ' + el.city + ', ' + el.country, value: el.title, category: "School", geometry: el.geometry.coordinates }))

            res(output)
        },

        appendTo: "#search-dropdown-results",

        minLength: 3,

        select: function(event, ui) {
            console.log(ui)
            if (ui.item.category == "City") {
                window.location.href = `${domain}/searchmap?lat=${ui.item.cityCenter[0]}&long=${ui.item.cityCenter[1]}&page=1`;
            }
        },
        response: function(event, ui) {
            if (!ui.content.length) {
                let noResult = { value: "", label: "Oh boy! No results found. Try again!"};
                ui.content.push(noResult)
            }
        }
    }).catcomplete( "instance" )._renderItem = function(ul, item) {
        return $( "<li>" )
            .append( "<span>" + item.label + "</span>")
            .appendTo(ul)
    };
});

