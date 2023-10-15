import axios from 'axios';
const API_KEY = '40040947-f33a087a3ed779154fc2d15f2';
const BASE_URL = 'https://pixabay.com/api/';

export function getImages(searchTag, page = 1, perPage = 40) {
  return axios.get(
    `${BASE_URL}?key=${API_KEY}&q=${searchTag}&image_type=photo&orientation=horizontal&safesearch=true&page=${page}&per_page=${perPage}`
  );
}
