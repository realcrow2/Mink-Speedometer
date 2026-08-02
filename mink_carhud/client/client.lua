Authorised = true
NUI_status = false
SeatBelt_on = false
CruiseControl_on = false
toggle = false -- when true, HUD is force-hidden via /carhudtoggle
local hudVisible = false
local refreshMs = 100

local function mph(speed)
    return speed * 2.236936
end

local function kmh(speed)
    return speed * 3.6
end

function Notif(notif_type, locale_key, ...)
    local msg = L(locale_key)
    if not msg then return end
    if select('#', ...) > 0 then
        msg = string.format(msg, ...)
    end
    Notification(notif_type, msg)
end

local function getLights(vehicle)
    local ok, lightsOn, highbeamsOn = pcall(GetVehicleLightsState, vehicle)
    if not ok then return false, false end
    -- native may return 0/1 or true/false depending on build
    local low = lightsOn == 1 or lightsOn == true
    local high = highbeamsOn == 1 or highbeamsOn == true
    return low, high
end

-- 0 = off, 1 = left, 2 = right, 3 = hazards
local indicatorMode = 0

local function applyIndicators(vehicle, mode)
    if not vehicle or vehicle == 0 then return end
    indicatorMode = mode
    -- GTA native: 0 = right, 1 = left (opposite of some docs)
    local leftOn = mode == 1 or mode == 3
    local rightOn = mode == 2 or mode == 3
    SetVehicleIndicatorLights(vehicle, 1, leftOn)
    SetVehicleIndicatorLights(vehicle, 0, rightOn)
end

local function getIndicators(vehicle)
    -- Keep our indicator mode applied (GTA can clear it)
    if indicatorMode ~= 0 then
        applyIndicators(vehicle, indicatorMode)
        return (indicatorMode == 1 or indicatorMode == 3), (indicatorMode == 2 or indicatorMode == 3)
    end

    local val = math.floor(tonumber(GetVehicleIndicatorLights(vehicle)) or 0)
    if val < 0 or val > 3 then val = 0 end
    return (val == 1 or val == 3), (val == 2 or val == 3)
end

local function toggleIndicator(side)
    local ped = PlayerPedId()
    if not IsPedInAnyVehicle(ped, false) then return end
    local vehicle = GetVehiclePedIsIn(ped, false)
    if side == 'left' then
        if indicatorMode == 1 then
            applyIndicators(vehicle, 0)
        else
            applyIndicators(vehicle, 1)
        end
    elseif side == 'right' then
        if indicatorMode == 2 then
            applyIndicators(vehicle, 0)
        else
            applyIndicators(vehicle, 2)
        end
    elseif side == 'hazards' then
        if indicatorMode == 3 then
            applyIndicators(vehicle, 0)
        else
            applyIndicators(vehicle, 3)
        end
    end
end

RegisterCommand('mink_indicator_left', function()
    toggleIndicator('left')
end, false)
RegisterCommand('mink_indicator_right', function()
    toggleIndicator('right')
end, false)
RegisterCommand('mink_indicator_hazards', function()
    toggleIndicator('hazards')
end, false)

RegisterKeyMapping('mink_indicator_left', 'Car HUD: Left indicator', 'keyboard', 'LEFT')
RegisterKeyMapping('mink_indicator_right', 'Car HUD: Right indicator', 'keyboard', 'RIGHT')
RegisterKeyMapping('mink_indicator_hazards', 'Car HUD: Hazards', 'keyboard', 'UP')

local function sendUpdate(data)
    data.action = 'update'
    SendNUIMessage(data)
end

CreateThread(function()
    while true do
        local wait = refreshMs
        local ped = PlayerPedId()
        local inVeh = IsPedInAnyVehicle(ped, false)

        if toggle or IsPauseMenuActive() then
            if hudVisible then
                hudVisible = false
                SendNUIMessage({ action = 'hide' })
            end
            wait = 500
        elseif inVeh then
            local vehicle = GetVehiclePedIsIn(ped, false)
            local speedMs = GetEntitySpeed(vehicle)
            local speedMph = mph(speedMs)
            local speedKmh = kmh(speedMs)
            local rpm = GetVehicleCurrentRpm(vehicle) -- 0.0 - 1.0 (can exceed slightly)
            local fuel = GetFuel(vehicle) or 0.0
            local engineHealth = GetVehicleEngineHealth(vehicle)
            local enginePct = math.max(0, math.min(100, engineHealth / 10.0))
            local maxSpeed = 300 -- Speedometer gauge max (MPH)
            local left, right = getIndicators(vehicle)
            local lowbeam, highbeam = getLights(vehicle)
            local street = GetStreetNames()
            local heading = GetEntityHeading(ped)

            if not hudVisible then
                hudVisible = true
                SendNUIMessage({ action = 'show' })
            end

            sendUpdate({
                speed = speedMph,
                speedKmh = speedKmh,
                rpm = rpm,
                fuel = fuel,
                maxSpeed = maxSpeed,
                engine = enginePct,
                seatbelt = SeatBelt_on,
                cruise = CruiseControl_on,
                left = left,
                right = right,
                lowbeam = lowbeam,
                highbeam = highbeam,
                street = street,
                heading = heading,
                hasSeatbelt = CheckVehClass(vehicle)
            })
        else
            if hudVisible then
                hudVisible = false
                SeatBelt_on = false
                CruiseControl_on = false
                indicatorMode = 0
                SendNUIMessage({ action = 'hide' })
            end
            wait = 500
        end

        Wait(wait)
    end
end)

RegisterNetEvent('mink_carhud:OpenSettingsUI')
AddEventHandler('mink_carhud:OpenSettingsUI', function()
    -- Settings menu removed
end)

RegisterNetEvent('mink_carhud:ToggleHud')
AddEventHandler('mink_carhud:ToggleHud', function()
    toggle = not toggle
    if toggle then
        hudVisible = false
        SendNUIMessage({ action = 'hide' })
        if Config.ToggleCarhud.minimap then
            DisplayRadar(false)
        end
    else
        if Config.ToggleCarhud.minimap and IsPedInAnyVehicle(PlayerPedId()) then
            DisplayRadar(true)
        end
    end
end)

RegisterNUICallback('close', function(_, cb)
    NUI_status = false
    SetNuiFocus(false, false)
    SendNUIMessage({ action = 'closeSettings' })
    cb('ok')
end)

RegisterNUICallback('saveSettings', function(data, cb)
    if data and data.refresh then
        refreshMs = math.max(16, tonumber(data.refresh) or 100)
    end
    NUI_status = false
    SetNuiFocus(false, false)
    SendNUIMessage({ action = 'closeSettings' })
    cb('ok')
end)

RegisterNUICallback('applySettings', function(data, cb)
    if data and data.refresh then
        refreshMs = math.max(16, tonumber(data.refresh) or 100)
    end
    cb('ok')
end)

RegisterNUICallback('setRefresh', function(data, cb)
    if data and data.refresh then
        refreshMs = math.max(16, tonumber(data.refresh) or 100)
    end
    cb('ok')
end)

exports('IsSeatbeltOn', function()
    return SeatBelt_on
end)

exports('ToggleSeatbelt', function(state)
    TriggerEvent('mink_carhud:ToggleSeatbelt', state)
end)
