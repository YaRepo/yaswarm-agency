on ensure_folder(acct, folder_name)
	tell application "Notes"
		try
			return folder folder_name of acct
		on error
			return make new folder at acct with properties {name:folder_name}
		end try
	end tell
end ensure_folder

on run argv
	if (count of argv) is less than 1 then error "usage: osascript apply_notes_moves.applescript <actions_tsv>"
	set actions_path to item 1 of argv
	set file_text to do shell script "cat " & quoted form of actions_path
	set lines_list to paragraphs of file_text

	set moved_count to 0
	set fail_count to 0

	tell application "Notes"
		repeat with row_text in lines_list
			if row_text is "" then
				-- skip
			else
				set AppleScript's text item delimiters to tab
				set parts to text items of row_text
				if (count of parts) < 3 then
					set fail_count to fail_count + 1
				else
					set note_id to item 1 of parts
					set folder_name to item 2 of parts
					set account_name to item 3 of parts

					try
						set acct to first account whose name is account_name
					on error
						set acct to first account
					end try

					try
						set target_folder to my ensure_folder(acct, folder_name)
						set note_ref to first note whose id is note_id
						move note_ref to target_folder
						set moved_count to moved_count + 1
					on error
						set fail_count to fail_count + 1
					end try
				end if
			end if
		end repeat
	end tell

	return "moved=" & moved_count & ",failed=" & fail_count
end run
