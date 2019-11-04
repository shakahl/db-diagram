# generate typescript from flatbuffer schema
gen:
	@echo "Generate Typescript files."
	@flatc --ts -o $(CURDIR)/src/@gen/binary --no-fb-import  $(CURDIR)/resources/flatbuffer/*.fbs