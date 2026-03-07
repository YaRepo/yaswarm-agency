on ensure_folder(acct, folder_name)
	tell application "Notes"
		try
			return folder folder_name of acct
		on error
			return make new folder at acct with properties {name:folder_name}
		end try
	end tell
end ensure_folder

on first_matching_note_in_folder(target_folder, note_name)
	tell application "Notes"
		try
			return first note of target_folder whose name is note_name
		on error
			return missing value
		end try
	end tell
end first_matching_note_in_folder

on run argv
	if (count of argv) is less than 1 then error "usage: osascript apply_semantic_merge.applescript <actions_tsv>"
	set actions_path to item 1 of argv
	set file_text to do shell script "cat " & quoted form of actions_path
	set lines_list to paragraphs of file_text

	set created_count to 0
	set moved_count to 0
	set fail_count to 0

	tell application "Notes"
		repeat with row_text in lines_list
			if row_text is "" then
				-- skip
			else
				set AppleScript's text item delimiters to tab
				set parts to text items of row_text
				if (count of parts) < 6 then
					set fail_count to fail_count + 1
				else
					set account_name to item 2 of parts
					set target_folder_name to item 3 of parts
					set merged_name to item 4 of parts
					set merged_file to item 5 of parts
					set dup_ids_text to item 6 of parts

					try
						set acct to first account whose name is account_name
					on error
						set acct to first account
					end try

					try
						set target_folder to my ensure_folder(acct, target_folder_name)
						set archive_folder to my ensure_folder(acct, "YaMac - Archive")

						set existing_note to my first_matching_note_in_folder(target_folder, merged_name)
						if existing_note is missing value then
							set merged_body to do shell script "cat " & quoted form of merged_file
							make new note at target_folder with properties {name:merged_name, body:merged_body}
							set created_count to created_count + 1
						end if

						if dup_ids_text is not "" then
							set AppleScript's text item delimiters to "|"
							set dup_ids to text items of dup_ids_text
							repeat with note_id in dup_ids
								if note_id is not "" then
									try
										set dup_note to first note whose id is note_id
										move dup_note to archive_folder
										set moved_count to moved_count + 1
									on error
										set fail_count to fail_count + 1
									end try
								end if
							end repeat
						end if
					on error
						set fail_count to fail_count + 1
					end try
				end if
			end if
		end repeat
	end tell

	return "created=" & created_count & ",archived=" & moved_count & ",failed=" & fail_count
end run
