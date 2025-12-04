const app = {
    data: {
        degrees: [],
        classes: [],
        teachers: [],
        matters: [],
        relationships: [],
        students: []
    },

    init: async function() {
        try {
            // Carrega JSONs
            const [resDeg, resCla, resTea, resMat, resRel] = await Promise.all([
                fetch('./Json/degrees.json'),
                fetch('./Json/classes.json'),
                fetch('./Json/teachers.json'),
                fetch('./Json/matters.json'),
                fetch('./Json/relationships.json')
            ]);

            this.data.degrees = await resDeg.json();
            
            // AJUSTE CLASSES (Wrapper)
            const classObj = await resCla.json();
            this.data.classes = classObj.classes;

            this.data.teachers = await resTea.json();
            this.data.matters = await resMat.json();
            
            // RELACIONAMENTOS (Cache ou JSON)
            const cachedRels = localStorage.getItem('relationshipsDB');
            if (cachedRels) {
                this.data.relationships = JSON.parse(cachedRels);
            } else {
                this.data.relationships = await resRel.json();
            }

            // ALUNOS DA TELA 1
            const storedStudents = localStorage.getItem('studentsDB');
            if (storedStudents) {
                this.data.students = JSON.parse(storedStudents);
            } else {
                const resStu = await fetch('./Json/students.json');
                this.data.students = await resStu.json();
            }

            this.populateCombos();
            this.renderTable();
            this.setupForm();
            this.setupModal();

        } catch (e) {
            console.error(e);
            alert("Erro ao carregar dados. Use Live Server.");
        }
    },

    // --- Helpers ---
    getName: (arr, id) => { const i = arr.find(x => x.id == id); return i ? i.name : '?'; },
    
    getClassName: function(idxOrId) {
        // ID 1 = Index 0
        const index = idxOrId - 1;
        return this.data.classes[index] ? this.data.classes[index].name : '?';
    },

    populateCombos: function() {
        const fill = (id, arr, isClass = false) => {
            const el = document.getElementById(id);
            if(!el) return;
            arr.forEach((item, index) => {
                // Se for classe, o valor é o index+1, senão é o item.id
                const val = isClass ? index + 1 : item.id;
                el.innerHTML += `<option value="${val}">${item.name}</option>`;
            });
        };

        fill('filterDegree', this.data.degrees);
        fill('filterClass', this.data.classes, true); // true indica que é classe
        
        fill('newTeacher', this.data.teachers);
        fill('newMatter', this.data.matters);
        fill('newDegree', this.data.degrees);
        fill('newClass', this.data.classes, true); // true indica que é classe
    },

    renderTable: function() {
        const tbody = document.getElementById('relationshipsTableBody');
        const fDegree = document.getElementById('filterDegree').value;
        const fClass = document.getElementById('filterClass').value;
        
        tbody.innerHTML = '';

        this.data.relationships.forEach(rel => {
            // Filtro complexo lidando com classId E classPosition
            const validDegrees = rel.degrees.filter(dObj => {
                const degMatch = fDegree === "" || dObj.degreeId == fDegree;
                
                const clsMatch = fClass === "" || dObj.classes.some(c => {
                    // SEU JSON USA OS DOIS CAMPOS, ENTÃO VERIFICAMOS AMBOS
                    const cId = c.classId || c.classPosition;
                    return cId == fClass;
                });

                return degMatch && clsMatch;
            });

            if(validDegrees.length === 0) return;

            const tr = document.createElement('tr');
            
            let details = '<ul class="nested-list">';
            validDegrees.forEach(dObj => {
                const dName = this.getName(this.data.degrees, dObj.degreeId);
                
                const cNames = dObj.classes.map(c => {
                    // Trata classId ou classPosition
                    const id = c.classId || c.classPosition;
                    return this.getClassName(id);
                }).join(', ');
                
                details += `
                    <li>
                        <strong>${dName}</strong>
                        <button class="btn-magic" onclick="app.openModal(${dObj.degreeId}, '${dName}')">Ver Alunos</button>
                        <br><small>Turmas: ${cNames}</small>
                    </li>
                `;
            });
            details += '</ul>';

            tr.innerHTML = `
                <td>${this.getName(this.data.teachers, rel.teacherId)}</td>
                <td>${this.getName(this.data.matters, rel.matterId)}</td>
                <td>${details}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    setupModal: function() {
        const modal = document.getElementById('studentModal');
        const close = document.querySelector('.close-modal');
        if(close) close.onclick = () => modal.style.display = 'none';
        window.onclick = (e) => { if(e.target == modal) modal.style.display = 'none'; };
    },

    openModal: function(degreeId, degreeName) {
        const list = document.getElementById('modalList');
        document.getElementById('modalTitle').innerText = `Alunos de: ${degreeName}`;
        list.innerHTML = '';

        const targets = this.data.students.filter(s => s.degreeId == degreeId);

        if(targets.length === 0) {
            list.innerHTML = '<li style="color:red">Nenhum aluno nesta série.</li>';
        } else {
            targets.forEach(s => {
                const cName = this.getClassName(s.classId);
                list.innerHTML += `<li>${s.name} (Turma ${cName}) - RA: ${s.ra}</li>`;
            });
        }
        document.getElementById('studentModal').style.display = 'block';
    },

    setupForm: function() {
        document.getElementById('btnAddRelationship').addEventListener('click', () => {
            const tId = parseInt(document.getElementById('newTeacher').value);
            const mId = parseInt(document.getElementById('newMatter').value);
            const dId = parseInt(document.getElementById('newDegree').value);
            const cId = parseInt(document.getElementById('newClass').value);

            let rel = this.data.relationships.find(r => r.teacherId === tId && r.matterId === mId);

            // Padronizamos salvar como 'classId' nos novos registros
            const newClassObj = { classId: cId };

            if(rel) {
                let deg = rel.degrees.find(d => d.degreeId === dId);
                if(deg) {
                    // Verifica duplicidade usando both keys
                    const exists = deg.classes.some(c => (c.classId || c.classPosition) === cId);
                    if(!exists) {
                        deg.classes.push(newClassObj);
                        alert("Turma adicionada ao Professor!");
                    } else {
                        alert("Professor já leciona nesta Turma!");
                        return;
                    }
                } else {
                    rel.degrees.push({ degreeId: dId, classes: [newClassObj] });
                    alert("Nova Série adicionada ao Professor!");
                }
            } else {
                const newId = Date.now();
                this.data.relationships.push({
                    id: newId,
                    teacherId: tId,
                    matterId: mId,
                    degrees: [{ degreeId: dId, classes: [newClassObj] }]
                });
                alert("Novo Relacionamento Criado!");
            }

            localStorage.setItem('relationshipsDB', JSON.stringify(this.data.relationships));
            this.renderTable();
        });
    }
};

app.init();