function makeBookmarksArray() {
    return [
        {
            "id": 1,
            "title": "Google",
            "url": "http://google.com",
            "description": "An indie search engine startup",
            "rating": 4
          },
          {
            "id": 2,
            "title": "Fluffiest Cats in the World",
            "url": "http://medium.com/bloggerx/fluffiest-cats-334",
            "description": "The only list of fluffy cats online",
            "rating": 5
          }
    ]
}

function makeMaliciousBookmark() {
  const maliciousBookmark = {
    id: 911,
    title: 'Naughty naughty very naughty <script>alert("xss");</script>',
    url: 'www.malicious.com',
    description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
    rating: 1
  }
  const expectedBookmark = {
    ...maliciousBookmark,
    title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
    description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
  }
  return {
    maliciousBookmark,
    expectedBookmark
  }
}

module.exports = { makeBookmarksArray, makeMaliciousBookmark }