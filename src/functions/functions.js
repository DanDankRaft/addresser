var location_components_cache = localStorage.getItem("ADDRESSER_location_components_cache") != null ? JSON.parse(localStorage.getItem("ADDRESSER_location_components_cache")) : {};
var place_id_cache = localStorage.getItem("ADDRESSER_place_id_cache") != null ? JSON.parse(localStorage.getItem("ADDRESSER_place_id_cache")) : {};
setInterval(() => {
  localStorage.setItem("ADDRESSER_place_id_cache", JSON.stringify(place_id_cache));
  localStorage.setItem("ADDRESSER_location_components_cache", JSON.stringify(location_components_cache));
}, 5000);

const api_url = 'https://nominatim.openstreetmap.org';
const northTexas = {x1: -97.596799, y1: 32.432177, x2: -96.136319, y2: 33.672544 };

function save_to_database(address, json) {
  if(address in place_id_cache === false)
  {
    place_id_cache[address] = json.place_id;
  }

  if(json.place_id in location_components_cache === false)
  {
    location_components_cache[json.place_id] = json;
  }

  return Promise.resolve(json);
}

/**
 * Returns the first search query result for a given address
 * @param {string} address
 * @returns the result object. see https://nominatim.org/release-docs/develop/api/Output/#json
 */
function get_location_details(address) {
  //STEP 1: if the address is already in the database, return that!
  if(address in place_id_cache)
    return Promise.resolve(location_components_cache[place_id_cache[address]]);

  //STEP 2: if that fails, make an API call!
  return fetch(`${api_url}?q=${address}&addressdetails=1&format=json&limit=1&viewbox=${[northTexas.x1,northTexas.y1,northTexas.x2,northTexas.y2].join(',')}`)
    .then(res => res.json())
    .then(json => save_to_database(address, json[0]));
}

/**
 * @customfunction GETCITY
 * @param {string[][][]} address_parts the address to search with
 * @returns {string} the city where the address is located
 */
export function get_city(address_parts) {
  let address = address_parts.flat().join(', ');
  return get_location_details(address)
    .then(res => res['address']['city'])
    .catch(err => 'NOT FOUND');
}

/**
 * Checks if an address contains a city name from a list, then checks OpenStreetMaps if that fails
 * @customfunction GETCITYFROMLIST
 * @param {string[][]} list 
 * @param {string[][][]} address_parts
 * @returns {string} city where the address is located!
 */
export function get_city_from_list(list, address_parts) {
  let address = address_parts.flat().join(', ');
  let citylist = list.flat();
  for(let city of citylist) {
    if(city != "" && address.toLowerCase().includes(city.toLowerCase()))
      return city;
  }

  return get_city(address);
}

/** 
 * Finds an address's county in OpenStreetMaps
 * @customfunction GETCOUNTY
 * @param {string[][][]} address_parts address to search for
 * @returns {string} county where the address is located
 */
export function get_county(address_parts) {
  let address = address_parts.flat().join(', ');
  return get_location_details(address)
    .then(res => res['address']['county'])
    .catch(err => 'NOT FOUND');
}

/**
 * Checks if an address contains a county name from a list, then checks OpenStreetMaps if that fails
 * @customfunction GETCOUNTYFROMLIST
 * @param {string[][]} list 
 * @param {string[][][]} address_parts
 * @returns {string} city where the address is located!
 */
export function get_county_from_list(list, address_parts) {
  let address = address_parts.flat().join(', ');
  let countylist = list.flat();
  for(let county of countylist) {
    if(county != "" && address.toLowerCase().includes(county.toLowerCase()))
      return county;
  }

  return get_county(address);
}

/**
 * @customfunction GETTYPE
 * @param {string[][][]} address_parts address
 * @returns {string} the location's type
 */
export function get_type(address_parts) {
  let address = address_parts.flat().join(', ');
  return get_location_details(address)
    .then(res => res['type'])
    .catch(err => 'NOT FOUND');
}

/**
 * @customfunction LAT
 * @param {string[][][]} address_parts the address to search with
 * @returns {number} the lattitude of the address
 */
export function get_lat(address_parts) {
  let address = address_parts.flat().join(', ');
  return get_location_details(address)
    .then(res => res['lat'])
    .catch(err => "NOT FOUND");
}

/**
 * this is an alias of ADDRESSER.LAT
 * @customfunction LATTITUDE
 * @param {string[][][]} address_parts the address to search with
 * @returns {number} the lattitude of the address
 */
export function get_lattitude(address_parts) {
  return get_lat(address_parts);
}

/**
 * @customfunction LON
 * @param {string[][][]} address_parts the address to search with
 * @returns {number} the longitude of the address
 */
export function get_lon(address_parts) {
  let address = address_parts.flat().join(', ');
  return get_location_details(address)
    .then(res => res['lon'])
    .catch(err => "NOT FOUND");
}

/**
 * this is an alias of ADDRESSER.LON
 * @customfunction LONGITUDE
 * @param {string[][][]} address_parts the address to search with
 * @returns {number} the longitude of the address
 */
export function get_longitude(address_parts) {
  return get_lon(address_parts);
}

/**
 * Returns the first input that does not evaluate to an error or "NOT FOUND"
 * @customfunction FALLBACK
 * @param {string[][][]} inputs
 * @returns the first result that is not 'NOT FOUND' or an error
 */
export function fallback(inputs) {
  let list = inputs.flat();
  for(let x in list) {
    if(list[x] != 'NOT FOUND' && list[x].charAt(0) != '#') {
      return list[x]
    }
  }
  return list[list.length - 1];
}