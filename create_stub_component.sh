#!/bin/bash
COMP=$1
cat > frontend/src/app/components/$COMP/${COMP}.component.ts << COMPTS
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-$COMP',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  template: \`
    <app-navbar></app-navbar>
    <div class="container mx-auto p-6">
      <h1 class="text-3xl font-bold">${COMP^}</h1>
      <p>Component coming soon...</p>
    </div>
  \`,
  styleUrls: ['./${COMP}.component.css']
})
export class ${COMP^}Component {
}
COMPTS
echo "Created ${COMP} component"
