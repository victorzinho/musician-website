const headersEs = require('../contents/headers.es.json');
const headersEn = require('../contents/headers.en.json');

const skills = require('../contents/skills.json');
const influences = require('../contents/influences.json');
const interests = require('../contents/interests.json');

const aboutMeEs = require('../contents/aboutMe.es');
const aboutMeEn = require('../contents/aboutMe.en');

const scoreFilters = require('../contents/scores/filters.json');

module.exports = {
  es: {
    headers: headersEs,
    skills: skills.map(skill => ({ name: skill.name.es, value: skill.value })),
    influences,
    interests: interests.map(interest => ({ name: interest.es, icon: interest.icon })),
    aboutMe: aboutMeEs,
    scores: {
      filters: scoreFilters.map(filter => ({ type: filter.type, name: filter.es }))
    }
  },
  en: {
    headers: headersEn,
    skills: skills.map(skill => ({ name: skill.name.en, value: skill.value })),
    influences,
    interests: interests.map(interest => ({ name: interest.en, icon: interest.icon })),
    aboutMe: aboutMeEn,
    scores: {
      filters: scoreFilters.map(filter => ({ type: filter.type, name: filter.en }))
    }
  }
};
