require('dotenv').config()
const userInfo = require('./services/userInfo')
const { Client, MessageEmbed } = require('discord.js')
const client = new Client()

client.on('ready', () => {
    console.log('Our bot is ready to go')
    client.user.setPresence({
        status: 'online',
        activity: {
            name: '/comandos',
            type: 'LISTENING'
        }
    })
})

client.on('message', async msg => {
    if (msg.content === '/mongodb-aggregate') {
        msg.reply(`db.usuarios.aggregate(
            [
                {
                    $match: { // Hace referencia a la "clave primaria" de la coleccion actual
                        _id: ObjectId("602697034b973e01bc4cf9d7")
                    }
                },
                {
                    $lookup: { // Hace el "inner join" a la coleccion cursos
                        from: 'cursos', // especifica la coleccion
                        localField: 'cursos', // hace referencia a la "clave foranea" de la coleccion actual
                        foreignField: '_id', // hace referenica a la "clave primaria" de la coleccion a unir
                        as: 'curso' // permite colocar el nombre del campo unido
                    }
                },
                {
                    $unwind: '$curso' // separa en documentos cuantas veces existan cursos dentro de alumnos
                },
                {
                    $lookup: {
                        from: 'docentes',
                        localField: 'curso.docente',
                        foreignField: '_id',
                        as: 'docente'
                    }
                },
                {
                    $unwind: '$docente'
                },
                {
                    $project: {
                        _id: '$_id',
                        nombre_alumno: '$nombre',
                        nombre_curso: '$curso.nombre',
                        nombre_docente: '$docente.nombre',
                        edad_docente: '$docente.edad'
                    }
                }
            ]
        ).pretty()
        `)
    }

    if (msg.content === '/mongodb-find') {
        msg.reply(`model.find()`)
    }

    if (msg.content === '/mongodb-insert') {
        msg.reply(`new Model({
            name: 'name',
            password: 'password'
        })`)
    }

    if (msg.content === '/mongodb-update') {
        msg.reply(`model.findByIdAndUpdate(id, {
            name: 'new name',
            password: 'new password'
        }, {
            new: true
        })`)
    }

    if (msg.content === '/mongodb-delete') {
        msg.reply(`model.findByIdAndDelete(id)`)
    }

    if (msg.content === '/comandos') {
        const embed1 = new MessageEmbed()
        .setColor('RED')
        .setTitle('Comandos para mongoose')
            .addField('/mongodb-find', 'Permite encontrar todos los documentos creados de una colecci??n')
            .addField('/mongodb-insert', 'Permite insertar un documento a la colecci??n')
            .addField('/mongodb-update', 'Permite actualizar un docuemnto de la colecci??n por su ID')
            .addField('/mongodb-delete', 'Permite eliminar un documento de la colleci??n por su ID')
        const embed2 = new MessageEmbed()
            .setColor('BLUE')
            .setTitle('Consumir APIS')
            .addField('/api/brawlhalla/{steam_id}', 'Muestra las estadisticas de tu cuenta de Brawlhalla.')
            .addField('/api/rickandmortyapi/{numero_personajes}', 'Permite ver los personajes de la serie de Rick y Morty seg??n la cantidad ingresada.')
        const embed3 = new MessageEmbed()
            .setColor('GREEN')
            .setTitle('Comandos adicionales')
            .addField('/steam-id', 'Muestra los pasos a seguir para obtener tu ID de Steam, que ser?? importante para algunas funcionalidades')
        msg.reply(embed1)
        msg.reply(embed2)
        msg.reply(embed3)

    }

    if (msg.content.includes('/api/rickandmortyapi')) {
        const number = Number(msg.content.split('/')[3])
        const MAX_CHARACTERS = 20

        if (number < MAX_CHARACTERS && number >= 1) {
            try {
                const response = await axios('https://rickandmortyapi.com/api/character')
                const data = response.data.results.slice(0, number)
    
                data.map(data => {
                    const embed = new MessageEmbed()
                    embed.addField(data.name, data.url)
                    embed.setImage(data.image)
                    msg.channel.send(embed)
                })
    
            } catch (error) {
                msg.channel.send('Hubo un error al momento de consumir la API')
            }  
        } else {
            msg.channel.send('El n??mero m??ximo de personajes es 20 y m??nimo 1')
        }
    }

    if (msg.content.includes('/api/brawlhalla')) {
        try {
            const steamId = msg.content.split('/')[3]
            try {
                const userData = await userInfo(steamId)
                const favoriteLegend = getFavoriteLegend(userData.legends)[0]
                const dontHaveClan = 'Sin clan'
                const embed = new MessageEmbed()

                embed.setTitle(`Informaci??n de Brawllhalla para el usuario: ${userData.name}`)
                .setColor('BLUE')
                .setDescription(`Has ganado el ${getWonParties(userData.games, userData.wins)} de todas tus partidas.\nAdem??s, has jugado con ${favoriteLegend.legend_name_key} el ${getWonParties(userData.games, favoriteLegend.games)} de todas tus partidas.`)
                .setAuthor(`${userData.name}`, msg.author.displayAvatarURL())
                .setThumbnail('https://tec.com.pe/wp-content/uploads/2020/08/1366_2000-45-750x430.jpg')
                .addFields(
                    { name: 'Partidas jugadas:', value: `${userData.games}`, inline: true },
                    { name: 'Partidas ganadas:', value: `${userData.wins}`, inline: true},
                    { name: 'Nombre del clan:', value: `${userData.clan ? userData.clan.clan_name : dontHaveClan}`, inline: true },
                    { name: '\u200B', value: '\u200B' },
                )
                .addField('Leyenda favorita:', `${favoriteLegend.legend_name_key}`, true)
                .addFields(
                    { name: 'Da??o causado:', value: `${favoriteLegend.damagedealt}`, inline: true },
                    { name: 'Da??o recibido:', value: `${favoriteLegend.damagetaken}`, inline: true},
                    { name: `Partidas ganadas con ${favoriteLegend.legend_name_key}:`, value: `${favoriteLegend.wins}`, inline: true },
                )
                .setImage('https://tec.com.pe/wp-content/uploads/2020/08/1366_2000-45-750x430.jpg')
                .setFooter(`${userData.name}`, msg.author.displayAvatarURL())
                .setTimestamp()
                msg.channel.send(embed)
            } catch (error) {
                msg.channel.send('Hubo un error al momento de consumir la API')
                console.log(error);
            }
        } catch (error) {
            msg.channel.send('Hubo un error al momento de consumir la API')
            console.log(error);
        }  
    }

    if (msg.content === '/steam-id') {
        const embed = new MessageEmbed()
        embed.setColor('GREEN')
            .setTitle('??C??mo obtener tu ID de Steam?')
            .setDescription('En el cliente de Steam ir a "detalles de la cuenta" que se encuentra en tu nombre de usuario que est?? la parte superior derecha.\n Luego aparecer?? algo parecido a la imagen que est?? a continuaci??n. Usa ese n??mero en los comandos que sean necesarios.')
            .setImage('https://res.cloudinary.com/josueemg/image/upload/v1639447721/codigo_x6gm12.png')
        msg.channel.send(embed)
    }
})

const getFavoriteLegend = (legends) => {
    return legends.sort((a, b) => b.games - a.games)
}

const getWonParties = (a, b) => {
    return `${Math.round((Number(b)/Number(a)) * 100)}%`
}

client.login(process.env.BOT_TOKEN)
