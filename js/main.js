'use strict';

function toggleMenu() {
  var menu = document.querySelector('.header ul');
  menu.classList.toggle('active');
}

function scrollToSection(sectionId) {
  var section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' });
  }
}
