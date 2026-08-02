fx_version 'cerulean'
game 'gta5'
author 'Mink'
description 'mink_carhud - Vehicle HUD'
version '1.0.0'
lua54 'yes'

shared_scripts {
    'configs/locales.lua',
    'configs/config.lua'
}

client_scripts {
    'configs/client_customise_me.lua',
    'client/*.lua'
}

server_scripts {
    'server/*.lua'
}

ui_page 'html/index.html'

files {
    'configs/config_ui.js',
    'configs/locales_ui.js',
    'html/index.html',
    'html/css/*.css',
    'html/js/*.js',
    'html/images/*.svg',
    'html/images/*.png',
    'html/sounds/*.ogg'
}
