-- Create the frame to listen for events
local frame = CreateFrame("Frame")
frame:RegisterEvent("PLAYER_ENTERING_WORLD")
frame:RegisterEvent("TIME_PLAYED_MSG")
frame:RegisterEvent("PLAYER_LOGOUT")

-- Initialize the SavedVariable if it doesn't exist
if not PlaytimeTrackerDB then
    PlaytimeTrackerDB = {}
end

frame:SetScript("OnEvent", function(self, event, ...)
    if event == "PLAYER_ENTERING_WORLD" then
        -- Request time played from server
        RequestTimePlayed()
    elseif event == "TIME_PLAYED_MSG" then
        local totalTime, levelTime = ...
        local name, realm = UnitName("player")
        
        -- Generate a unique ID for the character
        local charKey = name .. "-" .. (realm or "")
        
        -- Update the database
        PlaytimeTrackerDB[charKey] = {
            name = name,
            realm = realm,
            class = UnitClass("player"),
            level = UnitLevel("player"),
            totalTime = totalTime,
            lastUpdated = time()
        }
        
        print("|cff00ff00PlaytimeTracker:|r Time updated for " .. name)
    elseif event == "PLAYER_LOGOUT" then
        -- Request one last update before logout (might not always catch the return msg in time, but good to try)
        RequestTimePlayed()
    end
end)
