const path = require('path')
const express = require('express')
const uuid = require('uuid/v4')
const logger = require('../logger')
const { bookmarks } = require('../store')
const bookmarksRouter = express.Router()
const bodyParser = express.json()
const xss = require('xss')
const BookmarksService = require('../bookmarks-service')

bookmarksRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        BookmarksService.getAllBookmarks(knexInstance)
        .then(bookmarks => {
            res.json(bookmarks.map(bookmark => ({
                id: bookmark.id,
                title: xss(bookmark.title),
                url: xss(bookmark.url),
                description: xss(bookmark.description),
                rating: bookmark.rating
            })))
        }) 
        .catch(next)
    })
    .post(bodyParser, (req, res, next) => {
        for(const field of ['title', 'url', 'rating']) {
            if(!req.body[field]) {
                logger.error(`${field} is required`)
                return res.status(400).send({
                    error: { message: `Missing '${field}' in request body`}
                })
            }
        }

        const { title, url, description, rating } = req.body;
        const newBookmark = { title, url, description, rating }

        const ratingNum = Number(rating)

        if(!Number.isInteger(ratingNum) || ratingNum < 0 || ratingNum > 5) {
            logger.error(`Invalid rating '${rating}' supplied`)
            return res.status(400).send({
                error: {
                    message: `'rating' must be a number between 0 and 5`
                }
            })
        }



        BookmarksService.insertBookmarks(
            req.app.get('db'),
            newBookmark
        )
            .then(bookmark => {
                res
                    .status(201)
                    // .location(`/bookmarks/${bookmark.id}`)
                    .location(path.posix.join(req.originalUrl + `/${bookmark.id}`))
                    .json({
                        id: bookmark.id,
                        title: xss(bookmark.title),
                        url: xss(bookmark.url),
                        description: xss(bookmark.description),
                        rating: bookmark.rating
                    })
            })
            .catch(next)
    })

bookmarksRouter
    .route('/:bookmark_id')
    .all((req, res, next) => {
        const { bookmark_id } = req.params
        BookmarksService.getById(req.app.get('db'), bookmark_id)
            .then(bookmark => {
                if(!bookmark) {
                    logger.error(`Bookmark with id ${bookmark_id} not found.`)
                    return res.status(404).json({
                        error: { message: `Bookmark Not Found` }
                    })
                }
                res.bookmark = bookmark
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        const{ bookmark_id } = req.params
        BookmarksService.getById(knexInstance, bookmark_id)
            .then(bookmark => {
                if(!bookmark) {
                    logger.error(`Bookmark with id ${bookmark_id} not found`);
                    return res
                        .status(404).json({
                            error: { message: `Bookmark Not Found`}
                        })
                }
                res.json(bookmark);
            })
            .catch(next)
    })
    .delete((req, res, next) => {
        const { bookmark_id } = req.params
        BookmarksService.deleteBookmark(
            req.app.get('db'),
            bookmark_id
        )
            .then(numRowsAffected => {
                logger.info(`Bookmark with id ${bookmark_id} deleted.`)
                res.status(204).end()
            })
            .catch(next)

    })

    .patch(bodyParser, (req, res, next) => {
        const { title, url, description, rating } = req.body
        const bookmarkToUpdate = { title, url, description, rating }

        const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length
        if(numberOfValues === 0)
            return res.status(400).json({
                error: {
                    message: `Request body must contain either 'title', 'url', 'description', or 'rating'`
                }
            })
        BookmarksService.updateBookmark(
            req.app.get('db'),
            req.params.bookmark_id,
            bookmarkToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = bookmarksRouter