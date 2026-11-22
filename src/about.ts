const content = document.getElementById('about-section-content')
const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-about-tab]'))

const sections = {
  history: {
    number: '01', kicker: 'WHERE IT BEGINS', title: 'Company History',
    paragraph: '36 EXPOSURES grew from a love of the slower, more intentional side of photography. In a world where images are captured and forgotten in seconds, we wanted to make room for the process: choosing a roll, waiting for the negatives, and seeing a photograph come to life. Based in Singapore, our independent studio brings film development, scanning, printing and analogue essentials together in one welcoming place.',
  },
  mission: {
    number: '02', kicker: 'WHAT WE DO', title: 'Mission',
    paragraph: 'Our mission is to make analogue photography approachable, meaningful and easy to enjoy. We care for each roll through thoughtful development and scanning, help turn favourite frames into physical prints, and make the tools of film photography easier to discover. Whether someone is picking up a camera for the first time or returning to a familiar format, we want every part of the experience to feel considered and welcoming.',
  },
  vision: {
    number: '03', kicker: 'WHAT WE ASPIRE TO', title: 'Vision',
    paragraph: 'We envision a creative community that continues to value photographs as objects, experiences and memories — not just files on a screen. We hope to keep the curiosity of film alive for the next generation while giving experienced photographers a place to reconnect with the craft. Through accessible services, useful equipment and the joy of sharing finished photographs, we want analogue photography to remain part of how people see and remember the world.',
  },
  values: {
    number: '04', kicker: 'WHAT GUIDES US', title: 'Values',
    paragraph: 'We believe in care, curiosity and authenticity. Every frame deserves careful handling; every photographer deserves patience and clear guidance. We celebrate the character of film — its grain, colour shifts and happy imperfections — rather than chasing perfection. We value honest craft, thoughtful service, creative exploration and the simple pleasure of holding a photograph in your hands.',
  },
} as const

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const key = tab.dataset.aboutTab as keyof typeof sections
    const section = sections[key]
    if (!section || !content) return

    tabs.forEach((item) => {
      const selected = item === tab
      item.classList.toggle('is-selected', selected)
      item.setAttribute('aria-pressed', String(selected))
    })

    content.innerHTML = `
      <div class="about-content-inner">
        <p class="about-content-kicker">${section.number} / ${section.kicker}</p>
        <h2>${section.title}</h2>
        <p class="about-paragraph">${section.paragraph}</p>
        <span class="about-content-mark" aria-hidden="true">36</span>
      </div>`
  })
})
