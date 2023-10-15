import axios from 'axios';
import Notiflix from 'notiflix';
import * as imagesApi from './pixabay-api.js';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import _ from 'lodash';

const refs = {
  form: document.querySelector('#search-form'),
  gallery: document.querySelector('.gallery'),
  submitBtn: document.querySelector('.submit-btn'), //doesn't work for some reason:/
};
let page = 1;
let totalPages = 0;
let perPage = 40;

refs.form.addEventListener('submit', handleSubmit);
const modal = new SimpleLightbox('.photo-card a', {
  captionsData: 'alt',
  captionDelay: 250,
});
function scrollSmoothly() {
  const { height: cardHeight } =
    refs.gallery.firstElementChild.getBoundingClientRect();
  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
}

async function handleSubmit(event) {
  event.preventDefault();
  if (refs.form.elements[0].value.trim() === '') {
    Notiflix.Notify.failure(
      'Input is empty, please write down some search query!'
    );
    refs.gallery.innerHTML = '';
    return;
  }
  refs.form.elements[1].disabled = true;
  refs.gallery.innerHTML = '';
  page = 1;
  perPage = 40;
  stopScroll = false;

  window.addEventListener('scroll', _.throttle(handleScroll, 1000));
  try {
    const response = await imagesApi.getImages(
      refs.form.elements[0].value.trim()
    );
    if (response.data.total <= 0) {
      Notiflix.Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
      refs.form.elements[1].disabled = false;
      window.removeEventListener('scroll', _.throttle(handleScroll, 1000));
      stopScroll = true;
      return;
    }
    totalPages = Math.ceil(response.data.totalHits / perPage);
    if (totalPages === 1) Notiflix.Notify.success('Only one page was found :(');
    stopScroll = false;
    refs.gallery.insertAdjacentHTML(
      'beforeend',
      createGalleryMarkup(response.data.hits)
    );
    modal.refresh();
    refs.form.elements[1].disabled = false;
  } catch (error) {
    Notiflix.Notify.failure('Something went wrong, please, reload the page!');
    refs.form.elements[1].disabled = false;
  }
}

function handleScroll() {
  if (totalPages === 1) return;
  if (stopScroll) return;
  if (window.scrollY + window.innerHeight >= refs.gallery.scrollHeight) {
    if (totalPages <= page) {
      Notiflix.Notify.success(
        `We're sorry, but you've reached the end of search results.`
      );
      window.removeEventListener('scroll', _.throttle(handleScroll, 1000));
      stopScroll = true;
      return;
    }
    page += 1;
    imagesApi
      .getImages(refs.form.elements[0].value.trim(), page)
      .then(({ data }) => {
        refs.gallery.insertAdjacentHTML(
          'beforeend',
          createGalleryMarkup(data.hits)
        );
        console.log(data.hits.page);
        modal.refresh();
        scrollSmoothly();
      });
  }
}

function createGalleryMarkup(imagesObj) {
  return imagesObj
    .map(
      ({
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) => `<div class="photo-card">
  <a href="${largeImageURL}" class="photo-link-a"><img src="${webformatURL}" alt="${tags}" title="${tags}" class="photo-link-img"/></a>
  <div class="info">
    <p class="info-item">
      <b>Likes</b>
      ${likes}
    </p>
    <p class="info-item">
      <b>Views</b>
      ${views}
    </p>
    <p class="info-item">
      <b>Comments</b>
      ${comments}
    </p>
    <p class="info-item">
      <b>Downloads</b>
      ${downloads}
    </p>
  </div>
</div>`
    )
    .join('');
}
