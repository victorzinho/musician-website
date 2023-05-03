import Isotope from 'isotope-layout';
import Swal from 'sweetalert2';
import translations from './i18n';

const CSS_CLASS_MUSIC_PLAYER = 'music-player';
const CSS_CLASS_MUSIC_INFO = 'music-info';

const itemContainer = document.getElementById('portfolio-item-container');
const isotope = new Isotope(itemContainer, {
  itemSelector: '.portfolio-item',
  layoutMode: 'fitRows'
});

const filters = [...document.querySelectorAll('#portfolio-filters li')];
filters.forEach(filter => filter.addEventListener('click', event => {
  event.preventDefault();

  filters.forEach(otherFilter => otherFilter.classList.remove('filter-active'));
  filter.classList.add('filter-active');

  isotope.arrange({ filter: filter.getAttribute('data-filter') });
}));

function lang () {
  return window.location.pathname.replaceAll('/', '');
}

function i18n (path) {
  return path.split('.').reduce((prev, curr) => prev?.[curr], translations[lang()]);
}

function popup (parent, cssClass, htmlGetter) {
  const button = parent.querySelector(cssClass === CSS_CLASS_MUSIC_PLAYER ? '.portfolio-play-button' : '.portfolio-info-button');
  if (!button) return;

  button.addEventListener('click', () => {
    Swal.fire({
      title: '',
      html: htmlGetter(),
      showConfirmButton: false,
      showCloseButton: true,
      customClass: cssClass
    });
    document.activeElement.blur();
  });
}

function player (parent, scoreDescriptor) {
  popup(parent, CSS_CLASS_MUSIC_PLAYER, () => scoreDescriptor.playUrl.includes('soundcloud')
    ? `<iframe width="100%" height="300" allow="autoplay"
         src="https://w.soundcloud.com/player/?url=${scoreDescriptor.playUrl}&color=%23ff5500&auto_play=true&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true"></iframe>`
    : `<iframe width="560" height="315" src="${scoreDescriptor.playUrl}?autoplay=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`);
}

function info (parent, scoreDescriptor) {
  let info = `<h3>${scoreDescriptor.name}</h3>`;
  if (scoreDescriptor.duration) {
    info += `<p><span>${i18n('headers.duration')}</span>: ${scoreDescriptor.duration}</p>`;
  }
  if (scoreDescriptor.instrumentation[lang()]) {
    info += `<p><span>${i18n('headers.instrumentation')}</span>: ${scoreDescriptor.instrumentation[lang()]}</p>`;
  }
  if (scoreDescriptor.year) {
    info += `<p><span>${i18n('headers.year')}</span>: ${scoreDescriptor.year}</p>`;
  }
  if (scoreDescriptor.descriptionHtml[lang()]) {
    info += scoreDescriptor.descriptionHtml[lang()];
  }
  popup(parent, CSS_CLASS_MUSIC_INFO, () => info);
}

export function addPortfolioElement (scoreDescriptor) {
  const playButtonHtml = scoreDescriptor.playUrl
    ? '<div class="portfolio-play-button"><i class="fi fi-ss-volume"></i></div>'
    : '';
  const scoreButtonHtml = scoreDescriptor.scoreUrl
    ? `<a href="${scoreDescriptor.scoreUrl}" target="_blank">
        <i class="fi fi-ss-document"></i>
      </a>`
    : '';
  const infoButtonHtml = info
    ? '<div class="portfolio-info-button"><i class="fi fi-ss-info"></i></div>'
    : '';

  let newItem = document.createElement('div');
  newItem.className = 'mt-4 col-lg-3 col-md-3 portfolio-item filter-' + scoreDescriptor.type;
  newItem.innerHTML = `
  <img src="../images/pfbg.jpg" class="img-fluid" alt="">
  <div class="portfolio-info">
    <h3>${scoreDescriptor.name}</h3>
    <div class="portfolio-buttons">
      ${playButtonHtml}
      ${scoreButtonHtml}
      ${infoButtonHtml}
    </div>
  </div>
  `;
  newItem = itemContainer.appendChild(newItem);

  player(newItem, scoreDescriptor);
  info(newItem, scoreDescriptor);

  isotope.insert(newItem);
}

window.addEventListener('load', () => isotope.layout());
