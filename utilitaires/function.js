
const fs = require('fs')
const { readFile, writeFile } = require('fs/promises')
const { dirname } = require('path')
const path = require('path')
const safeRegex = require('safe-regex');

const stringTypeValues = (...args) => {
    const chaines = []
    for (const valeur of args) if (typeof valeur === 'string') chaines.push(valeur);
    return chaines
}

const detectItemsDeleted = (array, elementsToDelete) => {
    let itemsDeleted = [], items = [];
    array.forEach(word => {
        if (elementsToDelete.includes(word)) itemsDeleted.push(word)   
        else items.push(word)
    })
    const message = `${ 
        itemsDeleted.length === 0 ? 'Aucun mot n\'a été supprimé.' :
        itemsDeleted.length === 1 ? `${ itemsDeleted.length } mot a été supprimé : ${ itemsDeleted.join('') }.` :
        `${ itemsDeleted.length } mots ont été supprimés : ${ itemsDeleted.join(' ') }.`
    }`

    return {
        initArray: array,
        result: items, 
        itemsDeleted: itemsDeleted,
        message: message
    }

}

const detectItemsAdded = (array1, array2) => {
    let set1 = new Set(array1);
    let set2 = new Set(array2);
    let itemsAdded = [], itemsInArray = []

    for(let element of set2) {
        if (set1.has(element)) {
            itemsInArray.push(element)
        }
        else {
            set1.add(element)
            itemsAdded.push(element)   
        }  
    }

    const fractmessage1 = `${ 
            itemsAdded.length === 0 ? 'Aucun mot n\'a été ajouté.' :
            itemsAdded.length === 1 ? `${ itemsAdded.length } mot a été ajouté : ${ itemsAdded.join('') }.` :
            `${ itemsAdded.length } mots ont été ajoutés : ${ itemsAdded.join(' ') }.`
        }`

    const fractmessage2 = `${  itemsInArray.length === 0 ? '' :
            itemsInArray.length === 1 ? `${ itemsInArray.length } mot identique a été détecté : ${ itemsInArray.join('') }.` :
            `${ itemsInArray.length } mots identiques ont été détectés : ${ itemsInArray.join(' ') }.`
        } `

    const message = `${ fractmessage1 } ${fractmessage2}`

   return {
        doublonsDetected: itemsInArray, 
        itemsAdded: itemsAdded, 
        message: message,
        result: [...set1]
   }
    
}

const loadFile = async (file) => {
    const list = await readFile(file, 'utf-8')  
    return list?.length ? list.split('\n') : list.split('')
}

const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const trouverTousLesSousChaines = (t, z = (n, f) => [...Array(n)].map((_, i) => f(i))) => {
    return t.map(x => z(2, i => [...new Set(z(x.length - i - 1, j => x.substr(j, i + 2)))])).flat(2).reduce((a, b) => (a[b] = (a[b] || 0) + 1, a), {})
}

const write = async (path, obj) => await writeFile(path, JSON.stringify(obj), 'utf8', err => console.error(err))

exports.getSyllables = async (routeName, nb, limit) => {
    try {
        const listString = await readFile(`./listes/syllables/${ routeName }.txt`, 'utf-8')
        const list = await JSON.parse(listString)
        const result = Object.keys(list).filter(syllabe => list[syllabe] === nb)
        const globalLength = result.length
        const resultsliced = result.slice(0, limit)
        const resultslicedLength = resultsliced.length
        const message = 
            result === 0 ? `Aucune syllabe n\'a été trouvée pour le nombre ${ nb }.` :
            result.length === 1 ? `${ result.length } syllabe a été trouvée.` :
            `${ resultsliced.length } syllabes ont été trouvées.`
        
        return {
            message: message,
            sliced: resultsliced, 
            slicedLenght: resultslicedLength,
            global: result,
            globalLength : globalLength
        }

    } catch(error) {
        console.error(error)
    }
}

exports.generateLists = async (routeName) => {
    const list = await loadFile(`./listes/${ routeName }.txt`)
    await write(`./listes/syllables/${ routeName }.txt`, trouverTousLesSousChaines(list))
    const listOcc = await readFile(`./listes/syllables/${ routeName }.txt`, 'utf-8')
    return JSON.parse(listOcc)
}


const wordExplodeLetters = (word) => {
    if (word.match(/^[a-zA-Z]+$/)) return { word : word, size:  new Set([...word]).size }
}

const generateObjExplodeLetters = (dictionnaire) => {
    return dictionnaire.map(wordExplodeLetters).sort((a, b) => b.size - a.size)
}

exports.chooseNbExplodeletters = async (routeName, nbLetters, limit) => {
    const elements = await loadFile(`./listes/${ routeName }.txt`) 
    const transformDico = generateObjExplodeLetters(elements)
    const listNotFormat = transformDico.filter(element => element.size == nbLetters)
   
    const list = listNotFormat.reduce((acc, { word, size }, i) => {
        i === 0 && (acc.size = size);
        acc.content.push(word)
        return acc
    }, { content: [] })

    shuffle(list.content)
    const listLength = list.content.length
    const listSliced = list.content.slice(0, limit)
    const listSlicedLength = listSliced.length
    
    const message = `${ 
        listSlicedLength === 0 ? `Aucun mot n\'a été trouvé pour ce nombre.` :
        listSlicedLength === 1 ? `${ listSliced.length } mot a été trouvé.` :
        `${ listSlicedLength } mots ont été trouvés.`
    }`

    return {
        nb: list.size,
        message, 
        globalLength: listLength,
        data:listSliced
    }
    
}
exports.findLengthElement = async (uri, taille) => {
    const array = await loadFile(uri) || []
    let message, elements = [], elementsSliced = [];
    try {
        elements = shuffle(array.filter(element => element.length === taille))
        elementsSliced = elements.slice(0, 30)
        message = `${ 
            elementsSliced.length === 0 ? `Aucun mot n\'a été trouvé pour la taille ${ taille }.` :
            elementsSliced.length === 1 ? `${ elementsSliced.length } mot a été trouvé.` :
            `${ elementsSliced.length } mots ont été trouvés.`
        }`      
        
    } catch(e) {
        console.error(e)
    }
    return {
        message: message, 
        globalLength: elements.length,
        result:  elementsSliced 
    }
}

exports.findElement = async (uri, limit, syllabe) => {
    const array = await loadFile(uri) || []
    const regex = new RegExp(syllabe)
    let message, elements = [], elementsSliced = [];

    try {
        if (safeRegex(regex)) {
            elements = shuffle(array.filter(element => element.match(syllabe)))
            elementsSliced = elements.slice(0, limit)
            message = `${ 
                elementsSliced.length === 0 ? `Aucun mot n\'a été trouvé pour la syllabe ${ syllabe }.` :
                elementsSliced.length === 1 ? `${ elementsSliced.length } mot a été trouvé.` :
                `${ elementsSliced.length } mots ont été trouvés.`
            }`
        } else {
            console.log('no')
            message = `L'expression régulière insérée n'est pas adapatée. Réessayez avec une formulation valide.`
        }
    } catch(e) {
        console.error(e)
    }
    return {
        message: message, 
        globalLength: elements.length,
        result:  elementsSliced 
    }
}

exports.findAllItem = async(uri) => {
    const list = await loadFile(uri)
    return list
}

exports.newItems = async (uri, ...word) => {
    const list = await loadFile(uri) || []
    const toBeAdded = stringTypeValues(...word)
    const arrayInfos = detectItemsAdded(list, toBeAdded)
    const insertionResult = arrayInfos.result
    const textifiedArray = insertionResult.join('\n')
    fs.writeFile(uri, textifiedArray, 'utf8', (err) => {
        if (err) throw err
    })
    return arrayInfos
}

exports.removeItems = async (uri, ...word) => {
    let myList = await loadFile(uri) || []
    const toBeDeleted = stringTypeValues(...word)
    const arrayInfos = detectItemsDeleted(myList, toBeDeleted)
    const cleanedArray = arrayInfos.result
    const textifiedArray = cleanedArray.join('\n')
    fs.writeFile(uri, textifiedArray, 'utf8', (err) => {
        console.log(arrayInfos)
        if (err) throw err
    })
    return arrayInfos
}

const cut = (list) => {
    const o = [], len = list.length - 1
    for(let i = 0; i < len; i++) o.push(list.slice(i, i + 2), list.slice(i, i + 3))
    return o
}

const createUserModel = async (userBody, res) => {
    if (typeof userBody === "object" && Array.isArray(userBody)) {
        res.status(400).json('Seul un objet valide peut être inséré.')
        return 
    } else if (typeof userBody === "object") {
        const filepath = path.resolve(__dirname, '../auth/', 'users.json')
        let users = await readFile(filepath, 'utf-8')   
        let userParse = users === '' ? [] : JSON.parse(users) 
        const matchUsername = userParse.filter(user => userBody.username === user.username)
        if (!matchUsername.length) userParse.push(userBody)
        const textified = JSON.stringify(userParse)
        fs.writeFile(filepath, textified, 'utf8', (error) => {
            if (error) throw error;
        })
    } else {
        return res.status(400).json({ message : 'Problème de syntaxe.'})
    }
   
}

exports.createUser =  (username, password, bcrypt) => {
     bcrypt.hash(password, 10).then(async hash => 
         await createUserModel({ username: username, password: hash})   
    )
}

exports.getUsers = async () => {
    const users = await readFile('./auth/users.json', 'utf-8')
    return JSON.parse(users)
}

exports.objSyllabEffect = async (list, choose, routeName) => {
    const listText = await readFile(`./listes/syllables/${ routeName }.txt`, err => console.error(err))
    const obj = await JSON.parse(listText)
    const sy = [...new Set(list.flatMap(cut))]
    if (sy?.length === 0) return false
    sy.map(element => {
        if (choose === "delete") obj[element] > 0 && obj[element]-- 
        else if (choose === "add")!obj[element] ? obj[element] = 1 : ++obj[element]
    }) 
    await writeSyll(`./listes/syllables/${ routeName }.txt`, obj)
}