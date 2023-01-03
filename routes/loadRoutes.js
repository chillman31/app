module.exports = (app) => {
    const listes = ["dictionnaire", "gentiles", "fleurs", "adverbes"]
    for(let liste of listes) {
        require('./create-item')(app, liste)
        require('./delete-item')(app, liste)
        require('./find-item')(app, liste)
    }   
    app.use(({ res }) => {
        const message = `Impossible de trouver la ressource demandée. Vous pouvez essayer une autre URL.`
        res.status(404).json({ message })
    })
}