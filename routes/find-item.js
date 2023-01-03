
const { findElement } = require('../utilitaires/function')
const auth = require('../auth/auth')

module.exports = (app, routeName) => {
    app.get(`/api/${routeName}`, auth,  async (req, res) => {
        try {
            let limit = 10
            if (!req.query.syllabe) return res.status(400).json({ messsage: `La clé syllabe doit être définie dans l'url.` })
            if (!typeof req.query.syllabe === "string") {
                const message = `La demande est invalide : la clé syllabe doit être une chaîne de caractères.`
                return res.status(400).json({ message })
            }
            if(req.length > 40) return res.status(400).json({ message: `La taille de la syllabe est trop grande. `})
            
            if (req.query.limit) {
                if (isNaN(limit)) return res.status(400).json({ messsage: `La limite doit être un nombre.` })
                limit = parseInt(req.query.limit)
                if (limit < 1 || limit >= 100) return res.status(400).json({ message: 'La limité doit être supérieure au nombre 1 et inférieure ou égale au nombre 100.'})
            }

            const infos = await findElement('./listes/dictionnaire.txt', limit, req.query.syllabe.toLowerCase())
            return res.status(200).json({ message : infos.message, data: infos.result })
            
        } catch(error) {
            if (error instanceof SyntaxError) {
                const message = `La chaine JSON est invalide`
                return res.status(400).json({ message })
            }
            return res.status(500)
        }
    })
}