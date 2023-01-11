
const auth = require('../auth/auth')
const { generateLists, objSyllabEffect  } = require('../utilitaires/function')

module.exports = (app, routeName) => {
    app.get(`/api/${routeName}/generate`, auth, async (req, res) => {
        try {
            const data = await generateLists(routeName)
            const message = `Les données ont été récupérées avec succès.`
            return res.status(201).json({ message, data })
        } catch(error) {
            console.log(error)
            if (error instanceof SyntaxError) {
                const message = `La chaine JSON est invalide`
                return res.status(400).json({ message: message })
            }
            return res.status(500).json({ message: "Rééssayez dans quelques instants."})
        }
    })
}