
const fs = require('fs')
const { readFile } = require('fs/promises')
const { dirname } = require('path')
const path = require('path')

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
  
exports.findElement = async (uri, limit, syllabe) => {
    const array = await loadFile(uri) || []
    const elements = shuffle(array.filter(element => element.includes(syllabe)))
    const elementsSliced = elements.slice(0, limit)
    const message = `${ 
        elementsSliced.length === 0 ? `Aucun mot n\'a été trouvé pour la syllabe ${ syllabe }.` :
        elementsSliced.length === 1 ? `${ elementsSliced.length } mot a été trouvé.` :
        `${ elementsSliced.length } mots ont été trouvés.`
    }`
    return {
        message: message, 
        globalLength: elements.length,
        result: elementsSliced
    }
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