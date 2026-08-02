function GetTopSpeed(vehicle)
    local topspeed1 = GetVehicleHandlingFloat(vehicle, 'CHandlingData', 'fInitialDriveMaxFlatVel')
    local topspeed2 = GetVehicleHandlingFloat(vehicle, 'CHandlingData', 'fInitialDragCoeff')
    return CalculateTopSpeed(topspeed1, topspeed2)
end

function CalculateTopSpeed(topspeed1, topspeed2)
    local calc = 1.2
    if topspeed2 >= 1.5 then
        calc = 0.9
    elseif topspeed2 >= 1.0 then
        calc = 1.0 
    elseif topspeed2 >= 0.5 then
        calc = 1.1 
    end
    return math.ceil((topspeed1*calc)*1.1)
end

RegisterNetEvent('mink_carhud:ToggleNUIFocus')
AddEventHandler('mink_carhud:ToggleNUIFocus', function()
    NUI_status = true
    while NUI_status do
        SetNuiFocus(NUI_status, NUI_status)
        Wait(100)
    end
    SetNuiFocus(false, false)
end)

RegisterNetEvent('mink_carhud:ToggleSeatbelt')
AddEventHandler('mink_carhud:ToggleSeatbelt', function(state)
    if state ~= nil then
        SeatBelt_on = state
        if Config.Seatbelt.ENABLE then
	        ToggleSeatbelt(SeatBelt_on)
        end
    else
        SeatBelt_on = not SeatBelt_on
        if Config.Seatbelt.ENABLE then
            ToggleSeatbelt(SeatBelt_on)
        end
    end
end)

local zone_names = {    AIRP = "Los Santos International Airport",    ALAMO = "Alamo Sea",    ALTA = "Alta",    ARMYB = "Fort Zancudo",    BANHAMC = "Banham Canyon Dr",    BANNING = "Banning",    BAYTRE = "Baytree Canyon",    BEACH = "Vespucci Beach",    BHAMCA = "Banham Canyon",    BRADP = "Braddock Pass",    BRADT = "Braddock Tunnel",    BURTON = "Burton",    CALAFB = "Calafia Bridge",    CANNY = "Raton Canyon",    CCREAK = "Cassidy Creek",    CHAMH = "Chamberlain Hills",    CHIL = "Vinewood Hills",    CHU = "Chumash",    CMSW = "Chiliad Mountain State Wilderness",    CYPRE = "Cypress Flats",    DAVIS = "Davis",    DELBE = "Del Perro Beach",    DELPE = "Del Perro",    DELSOL = "La Puerta",    DESRT = "Grand Senora Desert",    DOWNT = "Downtown",    DTVINE = "Downtown Vinewood",    EAST_V = "East Vinewood",    EBURO = "El Burro Heights",    ELGORL = "El Gordo Lighthouse",    ELYSIAN = "Elysian Island",    GALFISH = "Galilee",    GALLI = "Galileo Park",    golf = "GWC and Golfing Society",    GRAPES = "Grapeseed",    GREATC = "Great Chaparral",    HARMO = "Harmony",    HAWICK = "Hawick",    HORS = "Vinewood Racetrack",    HUMLAB = "Humane Labs and Research",    JAIL = "Bolingbroke Penitentiary",    KOREAT = "Little Seoul",    LACT = "Land Act Reservoir",    LAGO = "Lago Zancudo",    LDAM = "Land Act Dam",    LEGSQU = "Legion Square",    LMESA = "La Mesa",    LOSPUER = "La Puerta",    MIRR = "Mirror Park",    MORN = "Morningwood",    MOVIE = "Richards Majestic",    MTCHIL = "Mount Chiliad",    MTGORDO = "Mount Gordo",    MTJOSE = "Mount Josiah",    MURRI = "Murrieta Heights",    NCHU = "North Chumash",    NOOSE = "N.O.O.S.E",    OCEANA = "Pacific Ocean",    PALCOV = "Paleto Cove",    PALETO = "Paleto Bay",    PALFOR = "Paleto Forest",    PALHIGH = "Palomino Highlands",    PALMPOW = "Palmer-Taylor Power Station",    PBLUFF = "Pacific Bluffs",    PBOX = "Pillbox Hill",    PROCOB = "Procopio Beach",    RANCHO = "Rancho",    RGLEN = "Richman Glen",    RICHM = "Richman",    ROCKF = "Rockford Hills",    RTRAK = "Redwood Lights Track",    SanAnd = "San Andreas",    SANCHIA = "San Chianski Mountain Range",    SANDY = "Sandy Shores",    SKID = "Mission Row",    SLAB = "Stab City",    STAD = "Maze Bank Arena",    STRAW = "Strawberry",    TATAMO = "Tataviam Mountains",    TERMINA = "Terminal",    TEXTI = "Textile City",    TONGVAH = "Tongva Hills",    TONGVAV = "Tongva Valley",    VCANA = "Vespucci Canals",    VESP = "Vespucci",    VINE = "Vinewood",    WINDF = "Ron Alternates Wind Farm",    WVINE = "West Vinewood",    ZANCUDO = "Zancudo River",    ZP_ORT = "Port of South Los Santos",    ZQ_UAR = "Davis Quartz"}
function GetStreetNames()
    local ped = PlayerPedId()
    local coords = GetEntityCoords(ped, false)
    local street = GetStreetNameAtCoord(coords.x, coords.y, coords.z)
    local street1 = GetStreetNameFromHashKey(street)
    local zone = tostring(GetNameOfZone(coords.x, coords.y, coords.z))
    local street2 = zone_names[tostring(zone)]
    if street2 then
        return street1..', '..street2
    else
        return street1
    end
end

function VelocitySpeedMaths(speed)
    local result = 1.0
    if speed > 100 then
        result = 1.4
    elseif speed > 80 then
        result = 1.25
    elseif speed > 60 then
        result = 1.1
    end
    return result
end

function TyreBurst(ped, vehicle)
    if not Config.Seatbelt.tyrepop then return end
    if not IsDriver(ped, vehicle) then return end
    local wheels = GetVehicleNumberOfWheels(vehicle)
    if wheels < 1 then return end
    SetVehicleTyreBurst(vehicle, math.random(0, math.max(0, wheels - 1)), true, 1000.0)
end

function Ragdoll(ped)
    if not Config.Seatbelt.ragdoll then return end
    SetPedToRagdoll(ped, 3000, 3000, 0, false, false, false)
end

local seatbeltState = {
    speed = 0.0,
    velocity = vector3(0.0, 0.0, 0.0),
    ejectCooldown = 0,
}

local function forwardOffset(ped)
    local heading = math.rad(GetEntityHeading(ped) + 90.0)
    return vector3(math.cos(heading) * 1.6, math.sin(heading) * 1.6, 0.15)
end

function EjectFromVehicle(ped, vehicle)
    if not Config.Seatbelt.eject then return end

    local coords = GetEntityCoords(ped)
    local fw = forwardOffset(ped)
    local vel = seatbeltState.velocity
    local boost = VelocitySpeedMaths(seatbeltState.speed)

    SetEntityCoords(ped, coords.x + fw.x, coords.y + fw.y, coords.z - 0.35, true, true, true, false)
    SetEntityVelocity(ped, vel.x * boost, vel.y * boost, (vel.z * boost) + 3.5)
    Ragdoll(ped)
end

function IsDriver(ped, vehicle)
    return GetPedInVehicleSeat(vehicle, -1) == ped
end

function ToggleSeatbelt(state)
    if not Authorised then return end
    local ped = PlayerPedId()
    local vehicle = GetVehiclePedIsIn(ped, false)
    local vehclass = vehicle ~= 0 and GetVehicleClass(vehicle) or -1

    if vehclass == 8 or vehclass == 13 then
        SeatBelt_on = false
        Notif(2, 'no_seatbelt')
        return
    end

    if not IsPedInAnyVehicle(ped, false) then return end

    if state then
        Notif(1, 'seatbelt_on')
        SendNUIMessage({ action = 'playSound', sound = 'seatbelt' })
        -- Make native windscreen eject extremely unlikely while belted
        SetFlyThroughWindscreenParams(10000.0, 10000.0, 17.0, 500.0)
    else
        Notif(2, 'seatbelt_off')
        SendNUIMessage({ action = 'playSound', sound = 'seatbeltoff' })
        -- Allow native eject behavior again
        SetFlyThroughWindscreenParams(16.0, 19.0, 17.0, 2000.0)
    end
end

function CheckVehClass(vehicle)
    local vehclass = GetVehicleClass(vehicle)
    return vehclass ~= 8 and vehclass ~= 13
end

local function applyCrashEffects(ped, vehicle)
    if GetGameTimer() < seatbeltState.ejectCooldown then return end
    seatbeltState.ejectCooldown = GetGameTimer() + 2500

    TyreBurst(ped, vehicle)
    if Config.Seatbelt.eject then
        EjectFromVehicle(ped, vehicle)
    end
end

if Config.Seatbelt.ENABLE then
    CreateThread(function()
        Wait(1000)
        while true do
            local sleep = 500
            local ped = PlayerPedId()

            if IsPedInAnyVehicle(ped, false) then
                local vehicle = GetVehiclePedIsIn(ped, false)

                if CheckVehClass(vehicle) then
                    sleep = 0

                    local speedMs = GetEntitySpeed(vehicle)
                    local speedMph = speedMs * 2.236936
                    local prevMph = seatbeltState.speed
                    local drop = prevMph - speedMph
                    local goingForward = GetEntitySpeedVector(vehicle, true).y > 1.0

                    local minSpeed = Config.Seatbelt.minSpeed or 55.0
                    local speedDrop = Config.Seatbelt.speedDrop or 25.0

                    -- Hard crash while unbelted: was fast, then sudden big speed loss
                    if not SeatBelt_on
                        and goingForward
                        and prevMph >= minSpeed
                        and drop >= speedDrop
                    then
                        applyCrashEffects(ped, vehicle)
                    end

                    seatbeltState.speed = speedMph
                    seatbeltState.velocity = GetEntityVelocity(vehicle)
                else
                    seatbeltState.speed = 0.0
                end
            else
                if SeatBelt_on then
                    SeatBelt_on = false
                    SetFlyThroughWindscreenParams(16.0, 19.0, 17.0, 2000.0)
                end
                seatbeltState.speed = 0.0
                seatbeltState.velocity = vector3(0.0, 0.0, 0.0)
            end

            Wait(sleep)
        end
    end)
end

-- Keep old HideMiniMap thread below this point
if Config.HideMiniMapOnFoot then
    CreateThread(function()
        local toggle_minimap = false
        while true do
            Wait(1000)
            if toggle and Config.ToggleCarhud and Config.ToggleCarhud.minimap then
                toggle_minimap = true
            elseif not toggle then
                toggle_minimap = false
            end
            local invehicle = IsPedInAnyVehicle(PlayerPedId())
            local minimap = IsRadarEnabled()
            if not invehicle and minimap and not toggle_minimap then
                DisplayRadar(false)
            elseif invehicle and not minimap and not toggle_minimap then
                DisplayRadar(true)
            elseif toggle_minimap then
                DisplayRadar(false)
            end
        end
    end)
end

RegisterNetEvent('mink_carhud:ToggleCruise')
AddEventHandler('mink_carhud:ToggleCruise', function()
    if not Authorised then return end
    if IsPedInAnyVehicle(PlayerPedId()) then
        if not CruiseControl_on then
            CruiseControl_on = true
            Notif(1, 'cruisecontrol_on')
            local vehicle = GetVehiclePedIsIn(PlayerPedId())
            local target_speed = GetEntitySpeed(vehicle)*2.236936
            local cruise_value = 0.0
            local increased = false

            CreateThread(function()
                while true do
                    Wait(5)
                    local ped = PlayerPedId()
                    local vehicle = GetVehiclePedIsIn(ped)
                    if not CruiseControl_on then break end
                    if IsControlJustPressed(0, 72) or IsControlJustPressed(0, 76) then CruiseControl_on = false Notif(3, 'cruisecontrol_off') break end
                    if not IsDriver(ped, vehicle) then CruiseControl_on = false Notif(3, 'cruisecontrol_off') break end
                    local calc_speed = target_speed-GetEntitySpeed(vehicle)*2.236936
                    if calc_speed > 0.30 then
                        local cruise_value = 1.0
                        if SlowSteeringSpeed(vehicle) then cruise_value = 0.2 end
                        if increased then cruise_value = cruise_value + 0.03 increased = false end
                        SetControlNormal(0, 71, cruise_value)
                    elseif calc_speed > -2.0 then
                        if not increased then increased = true end
                        SetControlNormal(0, 71, cruise_value)
                    elseif calc_speed > -10.0 then
                        CruiseControl_on = false
                        Notif(3, 'cruisecontrol_off')
                        break
                    end
                end
            end)
        else
            Notif(3, 'cruisecontrol_off')
            CruiseControl_on = false
        end
    else
        Notif(3, 'no_vehicle_found')
    end
end)

function SlowSteeringSpeed(vehicle)
    local angle = GetVehicleSteeringAngle(vehicle)
    if angle < -20.0 or angle > 20.0 then
        return true
    else
        return false
    end
end

CreateThread(function()
    -- settings reminder disabled
end)
